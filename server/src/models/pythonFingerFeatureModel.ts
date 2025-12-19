import { pool } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface PythonFingerFeature {
  id: number;
  user_id: number;
  fingerprint_path: string;
  vein_aug_path: string;
  vein_bin_path: string;
  knuckle_path: string;
  fingerprint_hash: string;
  vein_aug_hash: string;
  vein_bin_hash: string;
  knuckle_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePythonFingerFeatureParams {
  userId: number;
  fingerprintPath: string;
  veinAugPath: string;
  veinBinPath: string;
  knucklePath: string;
  fingerprintHash: string;
  veinAugHash: string;
  veinBinHash: string;
  knuckleHash: string;
}

export async function createPythonFingerFeatures(
  params: CreatePythonFingerFeatureParams
): Promise<PythonFingerFeature> {
  const {
    userId,
    fingerprintPath,
    veinAugPath,
    veinBinPath,
    knucklePath,
    fingerprintHash,
    veinAugHash,
    veinBinHash,
    knuckleHash,
  } = params;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO python_finger_features 
    (user_id, fingerprint_path, vein_aug_path, vein_bin_path, knuckle_path, 
     fingerprint_hash, vein_aug_hash, vein_bin_hash, knuckle_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fingerprintPath,
      veinAugPath,
      veinBinPath,
      knucklePath,
      fingerprintHash,
      veinAugHash,
      veinBinHash,
      knuckleHash,
    ]
  );

  return {
    id: result.insertId,
    user_id: userId,
    fingerprint_path: fingerprintPath,
    vein_aug_path: veinAugPath,
    vein_bin_path: veinBinPath,
    knuckle_path: knucklePath,
    fingerprint_hash: fingerprintHash,
    vein_aug_hash: veinAugHash,
    vein_bin_hash: veinBinHash,
    knuckle_hash: knuckleHash,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function updatePythonFingerFeatures(
  params: CreatePythonFingerFeatureParams
): Promise<void> {
  const {
    userId,
    fingerprintPath,
    veinAugPath,
    veinBinPath,
    knucklePath,
    fingerprintHash,
    veinAugHash,
    veinBinHash,
    knuckleHash,
  } = params;

  await pool.execute(
    `UPDATE python_finger_features SET 
    fingerprint_path = ?, vein_aug_path = ?, vein_bin_path = ?, knuckle_path = ?,
    fingerprint_hash = ?, vein_aug_hash = ?, vein_bin_hash = ?, knuckle_hash = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?`,
    [
      fingerprintPath,
      veinAugPath,
      veinBinPath,
      knucklePath,
      fingerprintHash,
      veinAugHash,
      veinBinHash,
      knuckleHash,
      userId,
    ]
  );
}

export async function getPythonFingerFeaturesByUserId(
  userId: number
): Promise<PythonFingerFeature | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM python_finger_features WHERE user_id = ?",
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as PythonFingerFeature;
}

export interface FindPythonUserParams {
  fingerprintHash?: string;
  veinAugHash?: string;
  veinBinHash?: string;
  knuckleHash?: string;
}

export async function findUserIdByPythonFingerHash(
  params: FindPythonUserParams
): Promise<number | null> {
  const { fingerprintHash, veinAugHash, veinBinHash, knuckleHash } = params;

  const conditions: string[] = [];
  const values: string[] = [];

  if (fingerprintHash) {
    conditions.push("fingerprint_hash = ?");
    values.push(fingerprintHash);
  }
  if (veinAugHash) {
    conditions.push("vein_aug_hash = ?");
    values.push(veinAugHash);
  }
  if (veinBinHash) {
    conditions.push("vein_bin_hash = ?");
    values.push(veinBinHash);
  }
  if (knuckleHash) {
    conditions.push("knuckle_hash = ?");
    values.push(knuckleHash);
  }

  if (conditions.length === 0) {
    return null;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT user_id FROM python_finger_features WHERE ${conditions.join(" OR ")}`,
    values
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].user_id;
}

export async function deletePythonFingerFeaturesByUserId(
  userId: number
): Promise<void> {
  await pool.execute(
    "DELETE FROM python_finger_features WHERE user_id = ?",
    [userId]
  );
}
