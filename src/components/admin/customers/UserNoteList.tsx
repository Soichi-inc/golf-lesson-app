import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { BookOpen, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { UserNote } from "@/types";

type Props = {
  notes: UserNote[];
};

export function UserNoteList({ notes }: Props) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
        <BookOpen className="size-8 mb-2 opacity-40" />
        <p className="text-sm">ミスの傾向ノートがありません</p>
      </div>
    );
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((note) => (
        <Card key={note.id} className="bg-white">
          <CardContent className="p-4">
            <div className="flex-1 min-w-0">
              {/* メタ情報 */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {note.title && (
                  <p className="font-medium text-stone-800 text-sm">
                    {note.title}
                  </p>
                )}
                {note.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-stone-500 border-stone-200 gap-1"
                  >
                    <Tag className="size-2.5" />
                    {note.category}
                  </Badge>
                )}
                <span className="text-[11px] text-stone-400">
                  {format(new Date(note.createdAt), "yyyy/MM/dd HH:mm", {
                    locale: ja,
                  })}
                </span>
              </div>

              {/* 本文 */}
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
