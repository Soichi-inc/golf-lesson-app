/**
 * Supabase Auth の全ユーザーを、ページを送りながら最後まで取得する。
 *
 * auth.admin.listUsers() はページを指定しないと「新しく登録された順に 50 人」しか返さない。
 * 登録者が 50 人を超えると、初期に作った管理者アカウントがその範囲から外れ、
 * 「管理者を探したが見つからない」状態になる（通知メールが管理者に届かなくなった原因）。
 * 全ユーザーを対象にする処理は、必ずこの関数を通すこと。
 *
 * ⚠️ Next.js / Supabase に依存させないこと（Node 単体のテストから読み込む）。
 */
export async function listAllUsers<U>(
  fetchPage: (page: number, perPage: number) => Promise<U[]>,
  options: { perPage?: number; maxPages?: number } = {}
): Promise<U[]> {
  const perPage = options.perPage ?? 1000;
  const maxPages = options.maxPages ?? 50;
  const all: U[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const users = await fetchPage(page, perPage);
    all.push(...users);
    if (users.length < perPage) break;
  }
  return all;
}

/**
 * 通知メールの宛先を決める。検出した管理者のアドレスに、予備の宛先（環境変数）を加え、
 * 大文字小文字の違いを無視して重複を除く。
 * 管理者の検出が一部でも失敗したときに、予備の宛先には必ず届くようにするため。
 */
export function mergeRecipients(
  adminEmails: string[],
  fallbackEmail: string | undefined | null
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const email of [...adminEmails, fallbackEmail ?? ""]) {
    const trimmed = email.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}
