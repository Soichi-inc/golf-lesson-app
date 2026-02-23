"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { BookOpen, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UserNote } from "@/types";

const noteSchema = z.object({
  title: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  content: z.string().min(1, "内容を入力してください").max(1000),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type Props = {
  notes: UserNote[];
};

export function MyNoteSection({ notes: initialNotes }: Props) {
  const [notes, setNotes] = useState(
    [...initialNotes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", category: "", content: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: NoteFormValues) {
    await new Promise((r) => setTimeout(r, 400));
    const newNote: UserNote = {
      id: `unote-${Date.now()}`,
      userId: "user-1",
      title: values.title || null,
      category: values.category || null,
      content: values.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    form.reset();
    setShowForm(false);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean))) as string[];
  const filtered = filterCategory
    ? notes.filter((n) => n.category === filterCategory)
    : notes;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-stone-800">ミスの傾向ノート</h2>
          <p className="text-xs text-stone-400 mt-0.5">{notes.length}件のメモ</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-stone-800 hover:bg-stone-700 text-xs gap-1.5"
        >
          <Plus className="size-3.5" />
          メモを追加
        </Button>
      </div>

      {/* カテゴリフィルター */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory(null)}
            className={`rounded-full px-3 py-1 text-[11px] border transition-colors ${
              filterCategory === null
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={`rounded-full px-3 py-1 text-[11px] border transition-colors ${
                filterCategory === cat
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      {showForm && (
        <div className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">新しいメモを追加</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-stone-600">タイトル（任意）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：バンカーショットのミス"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-stone-600">カテゴリ（任意）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：バンカー、ドライバー、パター"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-stone-600">内容</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ミスの状況・原因・改善策など自由に記録してください"
                        rows={4}
                        className="resize-none text-sm"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-stone-400 text-right">
                      {field.value.length}/1000
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowForm(false); form.reset(); }}
                  className="rounded-full border-stone-300 text-xs"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-full bg-stone-800 hover:bg-stone-700 text-xs"
                >
                  {isSubmitting ? "保存中..." : "保存する"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* ノート一覧 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
          <BookOpen className="mb-3 size-10 text-stone-300" />
          <p className="text-sm text-stone-500">
            {filterCategory ? `「${filterCategory}」のメモはありません` : "メモがありません"}
          </p>
          {!filterCategory && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-full bg-stone-800 hover:bg-stone-700"
            >
              最初のメモを追加する
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((note) => (
            <li key={note.id} className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <p className="font-medium text-stone-800 text-sm truncate">{note.title}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] text-stone-400">
                      {format(note.createdAt, "yyyy年M月d日", { locale: ja })}
                    </span>
                    {note.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-stone-50 text-stone-500 border-stone-200 gap-1 py-0"
                      >
                        <Tag className="size-2.5" />
                        {note.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="shrink-0 text-stone-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
