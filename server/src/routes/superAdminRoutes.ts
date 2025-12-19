import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import {
  listUsersHandler,
  createUserBySuperAdmin,
  updateUserBySuperAdmin,
  deleteUserBySuperAdmin,
} from "../controllers/superAdminController";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN"]));

router.get("/users", listUsersHandler);
router.post("/users", createUserBySuperAdmin);
router.put("/users/:id", updateUserBySuperAdmin);
router.delete("/users/:id", deleteUserBySuperAdmin);

export default router;

