import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config/config";
import {
  register,
  login,
  me,
  myFingerFeatures,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const uploadDir = path.join(__dirname, "..", "..", config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + ext);
  },
});

const upload = multer({ storage });

const router = Router();

// 普通用户注册：三种手指模态 + 基本信息（指静脉二值化自动处理）
router.post(
  "/register",
  upload.fields([
    { name: "fingerprint", maxCount: 1 },
    { name: "vein", maxCount: 1 },
    { name: "knuckle", maxCount: 1 },
  ]),
  register
);

// 账号密码 + 手指模态登录
router.post(
  "/login",
  upload.fields([
    { name: "fingerprint", maxCount: 1 },
    { name: "vein", maxCount: 1 },
    { name: "knuckle", maxCount: 1 },
  ]),
  login
);

// 获取当前登录用户信息
router.get("/me", authMiddleware, me);

// 获取当前登录用户的手指模态特征
router.get("/my-features", authMiddleware, myFingerFeatures);

export default router;

