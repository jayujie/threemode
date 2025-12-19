import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface JwtPayload {
  userId: number;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: JwtPayload["role"];
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "未提供认证信息" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "认证信息格式错误" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (e) {
    return res.status(401).json({ message: "认证失败或已过期" });
  }
}

