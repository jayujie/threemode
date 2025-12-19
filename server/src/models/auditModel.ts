import { pool } from "../config/db";

export interface AuditRecordInput {
  userId: number;
  adminId: number;
  action: "APPROVE" | "REJECT";
  reason?: string;
}

export async function createAuditRecord(input: AuditRecordInput) {
  await pool.execute(
    "INSERT INTO audit_records (user_id, admin_id, action, reason) VALUES (?,?,?,?)",
    [input.userId, input.adminId, input.action, input.reason || null]
  );
}

