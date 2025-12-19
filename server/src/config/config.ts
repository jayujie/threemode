export interface AppConfig {
  port: number;
  jwtSecret: string;
  uploadDir: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "finger-feature-secret",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "yyj13867684282..",
    database: process.env.DB_NAME || "finger_feature_db",
  },
};

