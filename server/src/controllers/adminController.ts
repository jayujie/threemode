import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  listUsers,
  findUserById,
  updateUserStatus,
  User,
} from "../models/userModel";
import { getFingerFeaturesByUserId } from "../models/fingerFeatureModel";
import { createAuditRecord } from "../models/auditModel";

export async function getPendingUsers(_req: Request, res: Response) {
  try {
    const users = await listUsers({ status: "PENDING" });
    const result = users
      .filter((u) => u.role === "USER")
      .map((u) => buildUserSummary(u));
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "获取待审核用户失败" });
  }
}

function buildUserSummary(user: User) {
  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
  };
}

export async function getUserDetail(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const features = await getFingerFeaturesByUserId(id);

    return res.json({
      user: buildUserSummary(user),
      fingerFeatures: features,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "获取用户详情失败" });
  }
}

export async function searchUsers(req: Request, res: Response) {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const mode = (req.query.mode as string | undefined)?.trim() || "all";

    let searchField: "id" | "username" | "real_name" | "email" | "phone" | "all" | undefined;

    switch (mode) {
      case "username":
        searchField = "username";
        break;
      case "realName":
        searchField = "real_name";
        break;
      case "email":
        searchField = "email";
        break;
      case "phone":
        searchField = "phone";
        break;
      case "id":
        searchField = "id";
        break;
      case "all":
      default:
        searchField = "all";
        break;
    }

    const users = await listUsers({
      keyword: q || undefined,
      searchField,
    });

    const result = users.map((u) => buildUserSummary(u));
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "搜索用户失败" });
  }
}


export async function auditUser(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const { action, reason } = req.body as {
      action: "APPROVE" | "REJECT";
      reason?: string;
    };

    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return res.status(400).json({ message: "审核动作不合法" });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    if (user.role !== "USER") {
      return res
        .status(400)
        .json({ message: "只能审核普通用户的注册信息" });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    await updateUserStatus(id, newStatus);

    await createAuditRecord({
      userId: id,
      adminId: req.user.id,
      action,
      reason,
    });

    const updated = await findUserById(id);

    return res.json({
      message: "审核成功",
      user: updated ? buildUserSummary(updated) : null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "审核失败" });
  }
}

