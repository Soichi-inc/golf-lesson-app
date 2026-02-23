import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Dumbbell, CalendarDays, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Drill } from "@/types";

const STATUS_MAP: Record<
  Drill["status"],
  { label: string; className: string }
> = {
  ASSIGNED: {
    label: "未着手",
    className: "bg-stone-100 text-stone-600 border-stone-200",
  },
  IN_PROGRESS: {
    label: "取り組み中",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "完了",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

type Props = {
  drills: Drill[];
};

export function DrillList({ drills }: Props) {
  if (drills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
        <Dumbbell className="size-8 mb-2 opacity-40" />
        <p className="text-sm">ドリルが登録されていません</p>
      </div>
    );
  }

  const sorted = [...drills].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((drill) => {
        const status = STATUS_MAP[drill.status];
        return (
          <Card key={drill.id} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <p className="font-medium text-stone-800 text-sm">
                      {drill.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  {drill.description && (
                    <p className="text-xs text-stone-600 leading-relaxed mb-2 whitespace-pre-wrap">
                      {drill.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                    <span>
                      割り当て:{" "}
                      {format(drill.createdAt, "yyyy/MM/dd", { locale: ja })}
                    </span>
                    {drill.dueDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        目標:{" "}
                        {format(drill.dueDate, "yyyy/MM/dd", { locale: ja })}
                      </span>
                    )}
                  </div>
                </div>

                {drill.videoUrl && (
                  <a
                    href={drill.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
