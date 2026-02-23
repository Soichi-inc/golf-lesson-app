"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, Lock, Unlock, Trash2 } from "lucide-react";
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

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "", isPrivate: true },
  });

  function onSubmit(values: NoteFormValues) {
    const newNote: InstructorNote = {
      id: `note-${Date.now()}`,
      userId,
      lessonRecordId: null,
      content: values.content,
      isPrivate: values.isPrivate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    form.reset({ content: "", isPrivate: true });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (confirm("このメモを削除しますか？")) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
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
                  >
                    保存
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
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: InstructorNote;
  onDelete: (id: string) => void;
}) {
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

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-stone-300 hover:text-red-400 hover:bg-red-50 shrink-0"
            onClick={() => onDelete(note.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
