import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config/config";
import { testConnection } from "./config/db";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import superAdminRoutes from "./routes/superAdminRoutes";
import pythonAuthRoutes from "./routes/pythonAuthRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态资源：手指模态图片
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", config.uploadDir))
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super", superAdminRoutes);
app.use("/api/python-auth", pythonAuthRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "服务器内部错误" });
});

const start = async () => {
  try {
    await testConnection();
    console.log("数据库连接成功");
  } catch (e) {
    console.error("数据库连接失败，请检查配置", e);
  }

  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
};

start();

