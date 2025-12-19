import { pool } from "../config/db";

export interface OperationLogInput {
  operatorId: number;
  targetUserId?: number | null;
  operationType: string;
  beforeData?: any;
  afterData?: any;
}

export async function createOperationLog(input: OperationLogInput) {
  await pool.execute(
    "INSERT INTO operation_logs (operator_id, target_user_id, operation_type, before_data, after_data) VALUES (?,?,?,?,?)",
    [
      input.operatorId,
      input.targetUserId ?? null,
      input.operationType,
      input.beforeData ? JSON.stringify(input.beforeData) : null,
      input.afterData ? JSON.stringify(input.afterData) : null,
    ]
  );
}

