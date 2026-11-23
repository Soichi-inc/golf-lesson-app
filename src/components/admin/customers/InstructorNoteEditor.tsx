"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  addInstructorNote,
  deleteInstructorNote,
  updateInstructorNote,
} from "@/app/actions/instructorNotes";
import { callAction } from "@/lib/client/call-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, Lock, Unlock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { InstructorNote } from "@/types";

const noteSchema = z.object({
  content: z.string().min(1, "内容を入力してください"),
  isPrivate: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type Props = {
  initialNotes: InstructorNote[];
  userId: string;
};

export function InstructorNoteEditor({ initialNotes, userId }: Props) {
  const [notes, setNotes] = useState<InstructorNote[]>(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "", isPrivate: true },
  });

  function onSubmit(values: NoteFormValues) {
    startTransition(async () => {
      const result = await callAction(() =>
        addInstructorNote({
          userId,
          content: values.content,
          isPrivate: values.isPrivate,
        })
      );
      if (result.success && result.note) {
        const added = result.note;
        setNotes((prev) => [added, ...prev]);
        form.reset({ content: "", isPrivate: true });
        setShowForm(false);
      } else {
        // 入力欄は閉じず、書いた文章を残したまま知らせる
        alert(result.error || "指導メモの保存に失敗しました");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("このメモを削除しますか？")) return;
    startTransition(async () => {
      const result = await callAction(() => deleteInstructorNote(id));
      if (result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        alert(result.error || "指導メモの削除に失敗しました");
      }
    });
  }

  /** 保存できたら true。失敗時は編集中の内容を残せるよう false を返す */
  async function handleUpdate(id: string, values: NoteFormValues): Promise<boolean> {
    try {
      const result = await updateInstructorNote(id, values);
      if (result.success && result.note) {
        const updated = result.note;
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        return true;
      }
      alert(result.error || "指導メモの更新に失敗しました");
      return false;
    } catch {
      // 通信断のほか、ログイン切れ（保存リクエストがログイン画面へ転送される）でもここに来る
      alert(
        "保存できませんでした。通信状況を確認して、もう一度お試しください。何度も失敗する場合はログインが切れている可能性があります。本文をコピーしてから、ページを再読み込みしてログインし直してください。"
      );
      return false;
    }
  }

  return (
    <div className="space-y-4">
      {/* 追加ボタン / フォーム */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm(true)}
        >
          <Plus className="size-4" />
          メモを追加
        </Button>
      ) : (
        <Card className="border-stone-300 bg-stone-50">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="指導メモを入力してください..."
                          rows={4}
                          className="bg-white resize-none"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 非公開チェック */}
                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isPrivate"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label
                          htmlFor="isPrivate"
                          className="text-xs text-stone-600 cursor-pointer"
                        >
                          顧客に非公開（プロのみ閲覧）
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-stone-800 hover:bg-stone-700"
                    disabled={isPending}
                  >
                    {isPending ? "保存中..." : "保存"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.reset();
                      setShowForm(false);
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* メモ一覧 */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-stone-400 border-2 border-dashed rounded-xl">
          <p className="text-sm">指導メモがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note: InstructorNote;
  onDelete: (id: string) => void;
  onUpdate: (id: string, values: NoteFormValues) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [draftPrivate, setDraftPrivate] = useState(note.isPrivate);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = draft !== note.content || draftPrivate !== note.isPrivate;

  function startEdit() {
    setDraft(note.content);
    setDraftPrivate(note.isPrivate);
    setIsEditing(true);
  }

  function cancelEdit() {
    if (isDirty && !confirm("編集中の内容を破棄しますか？")) return;
    setIsEditing(false);
  }

  async function save() {
    if (!isDirty) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const saved = await onUpdate(note.id, { content: draft, isPrivate: draftPrivate });
    setIsSaving(false);
    if (saved) setIsEditing(false);
  }

  if (isEditing) {
    const checkboxId = `isPrivate-${note.id}`;
    return (
      <Card className="border-stone-300 bg-stone-50">
        <CardContent className="p-4 space-y-3">
          <p className="text-[11px] text-stone-400">
            {format(note.createdAt, "yyyy/MM/dd HH:mm", { locale: ja })} のメモを編集中
          </p>

          <Textarea
            aria-label="指導メモの内容"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(Math.max(draft.split("\n").length + 2, 6), 40)}
            className="bg-white resize-none"
            autoFocus
          />
          {!draft.trim() && (
            <p className="text-xs text-red-500">内容を入力してください</p>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={draftPrivate}
              onCheckedChange={(checked) => setDraftPrivate(checked === true)}
            />
            <Label htmlFor={checkboxId} className="text-xs text-stone-600 cursor-pointer">
              顧客に非公開（プロのみ閲覧）
            </Label>
          </div>

          {!draftPrivate && note.isPrivate && (
            <p className="text-[11px] text-blue-600">
              保存すると、お客様にメールで通知されます。
            </p>
          )}
          {!draftPrivate && !note.isPrivate && (
            <p className="text-[11px] text-stone-500">
              お客様のマイページの内容も書き換わります（メールの再通知はありません）。
            </p>
          )}
          {draftPrivate && !note.isPrivate && (
            <p className="text-[11px] text-amber-600">
              保存すると、お客様のマイページには表示されなくなります。
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-stone-800 hover:bg-stone-700"
              disabled={isSaving || !draft.trim()}
              onClick={save}
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={cancelEdit}
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* メタ情報 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-stone-400">
                {format(note.createdAt, "yyyy/MM/dd HH:mm", { locale: ja })}
              </span>
              <Badge
                variant="outline"
                className={
                  note.isPrivate
                    ? "text-[10px] text-stone-500 border-stone-200 gap-1"
                    : "text-[10px] text-blue-600 border-blue-200 bg-blue-50 gap-1"
                }
              >
                {note.isPrivate ? (
                  <>
                    <Lock className="size-2.5" />
                    非公開
                  </>
                ) : (
                  <>
                    <Unlock className="size-2.5" />
                    顧客公開
                  </>
                )}
              </Badge>
            </div>

            {/* 本文 */}
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>
          </div>

          {/* 編集・削除ボタン */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              onClick={startEdit}
              aria-label="メモを編集"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-stone-300 hover:text-red-400 hover:bg-red-50"
              onClick={() => onDelete(note.id)}
              aria-label="メモを削除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
