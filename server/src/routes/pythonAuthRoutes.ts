import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config/config";
import {
  registerPythonFeatures,
  pythonLogin,
  getPythonFeatures,
  deletePythonFeatures,
} from "../controllers/pythonAuthController";
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

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 4 // 最多4个文件
  },
  fileFilter: (_req, file, cb) => {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|bmp|tiff|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

const router = Router();

// Python模态特征注册/更新（需要先登录）
router.post(
  "/register-features",
  authMiddleware,
  upload.fields([
    { name: "fingerprint", maxCount: 1 },
    { name: "vein_aug", maxCount: 1 },
    { name: "vein_bin", maxCount: 1 },
    { name: "knuckle", maxCount: 1 },
  ]),
  registerPythonFeatures
);

// Python模态登录
router.post(
  "/login",
  upload.fields([
    { name: "fingerprint", maxCount: 1 },
    { name: "vein_aug", maxCount: 1 },
    { name: "vein_bin", maxCount: 1 },
    { name: "knuckle", maxCount: 1 },
  ]),
  pythonLogin
);

// 获取当前用户的Python模态特征信息
router.get("/features", authMiddleware, getPythonFeatures);

// 删除当前用户的Python模态特征
router.delete("/features", authMiddleware, deletePythonFeatures);

// 错误处理中间件
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制（最大10MB）' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '上传文件数量超过限制' });
    }
  }
  
  if (error.message === '只允许上传图片文件') {
    return res.status(400).json({ message: error.message });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({ message: '文件上传失败' });
});

export default router;
