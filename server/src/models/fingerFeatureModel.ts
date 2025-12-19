import { pool } from "../config/db";

export interface FingerFeatureInput {
  userId: number;
  fingerprintPath: string;
  fingerJointPath: string;
  fingerVeinPath: string;
  veinBinPath: string;
  fingerprintHash: string;
  fingerJointHash: string;
  fingerVeinHash: string;
  veinBinHash: string;
}

export async function createFingerFeatures(input: FingerFeatureInput) {
  await pool.execute(
    `INSERT INTO finger_features (
      user_id,
      fingerprint_path,
      finger_joint_path,
      finger_vein_path,
      vein_bin_path,
      fingerprint_hash,
      finger_joint_hash,
      finger_vein_hash,
      vein_bin_hash
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      input.userId,
      input.fingerprintPath,
      input.fingerJointPath,
      input.fingerVeinPath,
      input.veinBinPath,
      input.fingerprintHash,
      input.fingerJointHash,
      input.fingerVeinHash,
      input.veinBinHash,
    ]
  );
}

export async function findUserIdByAnyFingerHash(params: {
  fingerprintHash?: string;
  fingerJointHash?: string;
  fingerVeinHash?: string;
  veinBinHash?: string;
}): Promise<number | null> {
  const {
    fingerprintHash = "",
    fingerJointHash = "",
    fingerVeinHash = "",
    veinBinHash = "",
  } = params;

  const [rows] = await pool.query<any[]>(
    `SELECT user_id FROM finger_features
     WHERE fingerprint_hash = ?
        OR finger_joint_hash = ?
        OR finger_vein_hash = ?
        OR vein_bin_hash = ?
     LIMIT 1`,
    [fingerprintHash, fingerJointHash, fingerVeinHash, veinBinHash]
  );

  const row = rows[0];
  return row ? (row.user_id as number) : null;
}

export async function getFingerFeaturesByUserId(userId: number) {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM finger_features WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

