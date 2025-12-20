import { pool } from "../config/db";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  real_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  realName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const role = input.role || "USER";
  const status = input.status || "PENDING";
  const [result] = await pool.execute<any>(
    "INSERT INTO users (username, password_hash, real_name, email, phone, role, status) VALUES (?,?,?,?,?,?,?)",
    [
      input.username,
      input.passwordHash,
      input.realName || null,
      input.email || null,
      input.phone || null,
      role,
      status,
    ]
  );
  const insertId = (result as any).insertId as number;
  const user = await findUserById(insertId);
  if (!user) {
    throw new Error("创建用户失败");
  }
  return user;
}

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  return rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

export interface ListUsersFilter {
  role?: UserRole;
  status?: UserStatus;
  /** 模糊搜索关键字 */
  keyword?: string;
  /** 搜索字段：不传或为 all 时，在多个字段中进行模糊搜索 */
  searchField?: "id" | "username" | "real_name" | "email" | "phone" | "all";
}

export async function listUsers(filter: ListUsersFilter = {}): Promise<User[]> {
  let sql = "SELECT * FROM users WHERE 1=1";
  const params: any[] = [];

  if (filter.role) {
    sql += " AND role = ?";
    params.push(filter.role);
  }
  if (filter.status) {
    sql += " AND status = ?";
    params.push(filter.status);
  }
  if (filter.keyword) {
    const kw = `%${filter.keyword}%`;

    if (filter.searchField && filter.searchField !== "all") {
      if (filter.searchField === "id") {
        sql += " AND CAST(id AS CHAR) LIKE ?";
        params.push(kw);
      } else {
        sql += ` AND ${filter.searchField} LIKE ?`;
        params.push(kw);
      }
    } else {
      sql +=
        " AND (CAST(id AS CHAR) LIKE ? OR username LIKE ? OR real_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      params.push(kw, kw, kw, kw, kw);
    }
  }

  sql += " ORDER BY created_at ASC";

  const [rows] = await pool.query<any[]>(sql, params);
  return rows as User[];
}

export async function updateUserStatus(
  id: number,
  status: UserStatus
): Promise<void> {
  await pool.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
}

export interface UpdateUserBasicInput {
  id: number;
  realName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
  rejectReason?: string | null;
}

export async function updateUserBasicInfo(
  input: UpdateUserBasicInput
): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (input.realName !== undefined) {
    fields.push("real_name = ?");
    params.push(input.realName);
  }
  if (input.email !== undefined) {
    fields.push("email = ?");
    params.push(input.email);
  }
  if (input.phone !== undefined) {
    fields.push("phone = ?");
    params.push(input.phone);
  }
  if (input.role !== undefined) {
    fields.push("role = ?");
    params.push(input.role);
  }
  if (input.status !== undefined) {
    fields.push("status = ?");
    params.push(input.status);
  }
  if (input.rejectReason !== undefined) {
    fields.push("reject_reason = ?");
    params.push(input.rejectReason);
  }

  if (!fields.length) {
    return;
  }

  params.push(input.id);
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  await pool.execute(sql, params);
}

export async function deleteUserById(id: number): Promise<void> {
  await pool.execute("DELETE FROM users WHERE id = ?", [id]);
}

