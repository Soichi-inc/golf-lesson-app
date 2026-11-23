import "server-only";
import type { InstructorNote } from "@/types";
import {
  readJsonFromStorage,
  updateJsonInStorage,
  type UpdateOutcome,
} from "@/lib/storage";

const FILE_PATH = "instructor-notes.json";

export type InstructorNoteRecord = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function readInstructorNoteRecords(): Promise<InstructorNoteRecord[]> {
  return readJsonFromStorage<InstructorNoteRecord[]>(FILE_PATH, [], { shape: "array" });
}

/**
 * 指導メモデータを書き換える。
 * 排他ロックの中で最新の内容を読み、mutate の結果を保存する（詳細は `@/lib/storage`）。
 */
export function updateInstructorNoteRecords<R>(
  mutate: (records: InstructorNoteRecord[]) => UpdateOutcome<InstructorNoteRecord[], R>
): Promise<R> {
  return updateJsonInStorage<InstructorNoteRecord[], R>(FILE_PATH, [], mutate, { shape: "array" });
}

export function toInstructorNote(r: InstructorNoteRecord): InstructorNote {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

/**
 * 指導メモ1件の本文・公開設定を書き換えた新しいレコード配列を返す。
 * 対象が見つからなければ null。createdAt は変えないため一覧の並び順は維持される。
 */
export function applyInstructorNoteUpdate(
  records: InstructorNoteRecord[],
  noteId: string,
  input: { content: string; isPrivate: boolean },
  nowIso: string
): {
  records: InstructorNoteRecord[];
  updated: InstructorNoteRecord;
  /** 非公開→公開に切り替わったか（この時点で初めて顧客に見えるようになる） */
  becamePublic: boolean;
} | null {
  const target = records.find((r) => r.id === noteId);
  if (!target) return null;

  const updated: InstructorNoteRecord = {
    ...target,
    content: input.content,
    isPrivate: input.isPrivate,
    updatedAt: nowIso,
  };

  return {
    records: records.map((r) => (r.id === noteId ? updated : r)),
    updated,
    becamePublic: target.isPrivate && !input.isPrivate,
  };
}

export async function getInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const records = await readInstructorNoteRecords();
  return records
    .filter((r) => r.userId === userId)
    .map(toInstructorNote)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
