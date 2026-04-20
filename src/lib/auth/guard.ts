import { createClient } from "@/lib/supabase/server";

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

  const role =
    user.app_metadata?.role === "ADMIN" ||
    user.user_metadata?.role === "ADMIN"
      ? "ADMIN"
      : "USER";

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
 * サーバーアクションでAuthErrorを捕捉して成功・失敗のobjectを返す
 */
export function handleActionError(
  e: unknown,
  fallback = "処理に失敗しました"
): { success: false; error: string } {
  if (e instanceof AuthError) {
    return { success: false, error: e.message };
  }
  console.error(e);
  return { success: false, error: fallback };
}
