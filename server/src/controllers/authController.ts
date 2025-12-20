import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { hashPassword, comparePassword } from "../utils/password";
import { hashFile } from "../utils/fingerHash";
import { binarizeVeinImage } from "../utils/veinBinarize";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  createUser,
  findUserByUsername,
  findUserById,
  User,
} from "../models/userModel";
import {
  createFingerFeatures,
  getFingerFeaturesByUserId,
  findUserIdByAnyFingerHash,
} from "../models/fingerFeatureModel";
import { AuthRequest } from "../middleware/auth";

export async function register(req: Request, res: Response) {
  try {
    const { username, password, realName, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "用户名和密码不能为空" });
    }

    const existed = await findUserByUsername(username);
    if (existed) {
      return res.status(400).json({ message: "该用户名已存在" });
    }

    const files = req.files as {
      [field: string]: Express.Multer.File[];
    };

    const fingerprintFile = files?.["fingerprint"]?.[0];
    const veinFile = files?.["vein"]?.[0];
    const knuckleFile = files?.["knuckle"]?.[0];

    if (!fingerprintFile || !veinFile || !knuckleFile) {
      return res.status(400).json({ message: "必须上传三种手指模态图片（指纹、指静脉、指节纹）" });
    }

    const veinBinFilename = `vein_bin_${uuidv4()}${path.extname(veinFile.filename)}`;
    const veinBinPath = path.join(path.dirname(veinFile.path), veinBinFilename);
    
    try {
      await binarizeVeinImage(veinFile.path, veinBinPath);
    } catch (err) {
      console.error("指静脉二值化失败:", err);
      return res.status(500).json({ message: "指静脉图像处理失败" });
    }

    const fingerprintHash = await hashFile(fingerprintFile.path);
    const veinAugHash = await hashFile(veinFile.path);
    const veinBinHash = await hashFile(veinBinPath);
    const knuckleHash = await hashFile(knuckleFile.path);

    const existedUserId = await findUserIdByAnyFingerHash({
      fingerprintHash,
      fingerJointHash: knuckleHash,
      fingerVeinHash: veinAugHash,
      veinBinHash,
    });

    if (existedUserId) {
      return res.status(409).json({
        message: "检测到该手指模态特征已存在，请直接登录",
        userId: existedUserId,
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      passwordHash,
      realName,
      email,
      phone,
    });

    await createFingerFeatures({
      userId: user.id,
      fingerprintPath: fingerprintFile.filename,
      fingerJointPath: knuckleFile.filename,
      fingerVeinPath: veinFile.filename,
      veinBinPath: veinBinFilename,
      fingerprintHash,
      fingerJointHash: knuckleHash,
      fingerVeinHash: veinAugHash,
      veinBinHash,
    });

    return res.status(201).json({
      message: "注册成功，等待管理员审核",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "注册失败" });
  }
}

function buildUserResponse(user: User) {
  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    const files = req.files as { [field: string]: Express.Multer.File[] };

    const fingerprintFile = files?.["fingerprint"]?.[0];
    const veinFile = files?.["vein"]?.[0];
    const knuckleFile = files?.["knuckle"]?.[0];

    if (!username || !password) {
      return res.status(400).json({ message: "用户名和密码不能为空" });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    // 如果上传了图片则验证手指模态（支持3张图片）
    if (fingerprintFile || veinFile || knuckleFile) {
      const hashes: any = {};
      
      if (fingerprintFile) {
        hashes.fingerprintHash = await hashFile(fingerprintFile.path);
      }
      if (veinFile) {
        hashes.fingerVeinHash = await hashFile(veinFile.path);
        
        // 自动二值化指静脉图像并计算哈希
        const veinBinFilename = `vein_bin_${uuidv4()}${path.extname(veinFile.filename)}`;
        const veinBinPath = path.join(path.dirname(veinFile.path), veinBinFilename);
        try {
          await binarizeVeinImage(veinFile.path, veinBinPath);
          hashes.veinBinHash = await hashFile(veinBinPath);
        } catch (err) {
          console.error("登录时指静脉二值化失败:", err);
        }
      }
      if (knuckleFile) {
        hashes.fingerJointHash = await hashFile(knuckleFile.path);
      }

      if (Object.keys(hashes).length > 0) {
        const matchedUserId = await findUserIdByAnyFingerHash(hashes);
        if (!matchedUserId || matchedUserId !== user.id) {
          return res.status(401).json({ message: "手指模态验证失败" });
        }
      }
    }

    if (user.status === "REJECTED" || user.status === "DISABLED") {
      return res.status(403).json({
        message: "当前账号审核未通过或已被禁用，无法登录",
        status: user.status,
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: buildUserResponse(user),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "登录失败" });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    return res.json(buildUserResponse(user));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "获取用户信息失败" });
  }
}



export async function myFingerFeatures(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    const features = await getFingerFeaturesByUserId(req.user.id);
    if (!features) {
      return res
        .status(404)
        .json({ message: "未找到手指模态特征" });
    }

    return res.json({
      fingerprintPath: features.fingerprint_path,
      fingerJointPath: features.finger_joint_path,
      fingerVeinPath: features.finger_vein_path,
      veinBinPath: features.vein_bin_path,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "获取手指模态特征失败" });
  }
}
