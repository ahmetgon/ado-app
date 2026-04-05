import { useState } from "react";
import { Calendar } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/store/useAppStore";
import { TaskDetail } from "./TaskDetail";
import type { Task } from "@/types";

interface Props {
  task: Task;
  listColor: string;
}

export function TaskCard({ task, listColor }: Props) {
  const [open, setOpen] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const isOverdue =
    task.dueDate && task.listId !== "done"
      ? new Date(task.dueDate) < new Date()
      : false;

  return (
    <>
      <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
        <button
          onClick={() => setOpen(true)}
          {...attributes}
          {...listeners}
          className={cn(
            "w-full text-left",
            "bg-white dark:bg-gray-800 border border-[#ebebeb] dark:border-gray-700 rounded-xl px-3 py-2.5",
            "shadow-sm shadow-black/[0.04] dark:shadow-black/20",
            "hover:border-[#d0d0d0] dark:hover:border-gray-600 hover:shadow-md hover:shadow-black/[0.06]",
            "hover:-translate-y-px transition-all duration-150 ease-out",
            "cursor-grab active:cursor-grabbing",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          )}
        >
          <div className="flex items-start gap-2">
            <span className={cn("mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full", priority.dot)} />
            <span className="text-[13px] font-medium text-[#1a1a1a] dark:text-gray-100 leading-snug line-clamp-2">
              {task.title}
            </span>
          </div>
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1 mt-2 ml-3.5 text-[11px]",
              isOverdue ? "text-red-400" : "text-[#bbb] dark:text-gray-600"
            )}>
              <Calendar size={11} />
              <span>{new Date(task.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </button>
      </div>
      <TaskDetail task={task} listColor={listColor} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
