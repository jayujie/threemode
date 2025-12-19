import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function requireRole(roles: ("USER" | "ADMIN" | "SUPER_ADMIN")[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "没有访问权限" });
    }
    next();
  };
}

