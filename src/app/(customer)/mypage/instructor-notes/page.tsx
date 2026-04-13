import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicInstructorNotesByUserId } from "@/app/actions/instructorNotes";

export const metadata: Metadata = { title: "講師からのメモ" };

export const dynamic = "force-dynamic";

export default async function InstructorNotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notes = user ? await getPublicInstructorNotesByUserId(user.id) : [];

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            マイページ
          </Link>
          <h1 className="text-xl font-light tracking-wide text-stone-800">
            講師からのメモ
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            プロからの指導メモ・アドバイス
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
            <MessageSquare className="mb-3 size-10 text-stone-300" />
            <p className="text-sm text-stone-500">
              講師からのメモはまだありません
            </p>
            <p className="text-xs text-stone-400 mt-1">
              レッスン後に講師からメモが届きます
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-4 sm:p-5"
              >
                <p className="text-[11px] text-stone-400 mb-2">
                  {format(note.createdAt, "yyyy年M月d日（E） HH:mm", {
                    locale: ja,
                  })}
                </p>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
