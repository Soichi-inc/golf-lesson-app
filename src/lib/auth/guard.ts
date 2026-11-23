import { createClient } from "@/lib/supabase/server";
import { storageErrorMessage } from "@/lib/storage-core";
import { isAdminUser } from "@/lib/auth/role";

export type AuthedUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  fullName: string | null;
};

/**
 * ログインユーザーを取得（未ログインなら throw）
 * サーバーアクションの先頭で呼び出して使用
 */
export async function requireUser(): Promise<AuthedUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError("ログインが必要です", 401);
  }

  // 管理者の根拠は app_metadata だけ（user_metadata は本人が書き換えられる。詳細は lib/auth/role.ts）
  const role = isAdminUser(user) ? "ADMIN" : "USER";

  return {
    id: user.id,
    email: user.email || "",
    role,
    fullName: user.user_metadata?.full_name || null,
  };
}

/**
 * ADMINロール必須（非ADMINならthrow）
 */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AuthError("管理者権限が必要です", 403);
  }
  return user;
}

/**
 * 所有者のみ許可（自分のuserIdまたはADMINはOK）
 */
export async function requireOwnerOrAdmin(
  targetUserId: string
): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;
  if (user.id !== targetUserId) {
    throw new AuthError("他のユーザーのデータにアクセスできません", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * サーバーアクションで例外を捕捉して成功・失敗のobjectを返す
 *
 * - AuthError: そのままの文言（ログインが必要です 等）
 * - StorageError: 「もう一度お試しください」等、次に取る行動がわかる文言
 *   （詳細は発生箇所でログ出力済み）
 * - それ以外: 呼び出し元が指定した文言
 */
export function handleActionError(
  e: unknown,
  fallback = "処理に失敗しました"
): { success: false; error: string } {
  if (e instanceof AuthError) {
    return { success: false, error: e.message };
  }
  const storageMessage = storageErrorMessage(e);
  if (storageMessage) {
    return { success: false, error: storageMessage };
  }
  console.error(e);
  return { success: false, error: fallback };
}
