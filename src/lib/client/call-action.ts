/**
 * サーバーアクションを呼び出す（画面側の共通処理）
 *
 * 通信が切れた・ログインが切れた（リクエストがログイン画面へ転送される）・
 * サーバーが時間切れになった、といった場合、サーバーアクションの呼び出しは
 * 結果を返さずに例外で終わる。そのままだと「処理中…」の表示が解除されず、
 * 画面が固まったように見える。ここで受け止めて、必ず { success: false, error }
 * の形で返す。
 */
export const ACTION_UNREACHABLE_MESSAGE =
  "通信に失敗しました。電波の状況を確認して、もう一度お試しください。何度も失敗する場合は、ページを再読み込みしてログインし直してください。";

export async function callAction<T extends { success: boolean; error?: string }>(
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error(e);
    return { success: false, error: ACTION_UNREACHABLE_MESSAGE } as T;
  }
}
