import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  listUsers,
  createUser,
  findUserById,
  updateUserBasicInfo,
  deleteUserById,
  UserRole,
  UserStatus,
} from "../models/userModel";
import { createOperationLog } from "../models/operationLogModel";
import { hashPassword } from "../utils/password";

export async function listUsersHandler(req: Request, res: Response) {
  try {
    const role = req.query.role as UserRole | undefined;
    const status = req.query.status as UserStatus | undefined;
    const users = await listUsers({ role, status });
    return res.json(users);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "获取用户列表失败" });
  }
}

export async function createUserBySuperAdmin(
  req: AuthRequest,
  res: Response
) {
  try {
    const { username, password, realName, email, phone, role } = req.body as {
      username: string;
      password: string;
      realName?: string;
      email?: string;
      phone?: string;
      role: UserRole;
    };

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "用户名、密码和角色为必填项" });
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({
      username,
      passwordHash,
      realName,
      email,
      phone,
      role,
      status: "APPROVED",
    });

    if (req.user) {
      await createOperationLog({
        operatorId: req.user.id,
        targetUserId: user.id,
        operationType: "CREATE_USER",
        beforeData: null,
        afterData: user,
      });
    }

    return res.status(201).json(user);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "创建用户失败" });
  }
}

export async function updateUserBySuperAdmin(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const { realName, email, phone, role, status } = req.body as {
      realName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      status?: UserStatus;
    };

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const before = { ...user };

    await updateUserBasicInfo({
      id,
      realName,
      email,
      phone,
      role,
      status,
    });

    const updated = await findUserById(id);

    if (req.user) {
      await createOperationLog({
        operatorId: req.user.id,
        targetUserId: id,
        operationType: "UPDATE_USER",
        beforeData: before,
        afterData: updated,
      });
    }

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "更新用户失败" });
  }
}

export async function deleteUserBySuperAdmin(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 先记录日志再删除用户（因为外键约束）
    if (req.user) {
      await createOperationLog({
        operatorId: req.user.id,
        targetUserId: id,
        operationType: "DELETE_USER",
        beforeData: user,
        afterData: null,
      });
    }

    await deleteUserById(id);

    return res.json({ message: "删除成功" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "删除用户失败" });
  }
}

