import { Plus } from "lucide-react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useActiveTasks } from "@/store/useAppStore";
import { TaskCard } from "./TaskCard";
import { AddTaskModal } from "./AddTaskModal";
import type { TaskList } from "@/types";

interface Props {
  list: TaskList;
}

export function Column({ list }: Props) {
  const tasks = useActiveTasks(list.id);
  const [addOpen, setAddOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: list.id });

  return (
    <>
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666] dark:text-gray-400">
              {list.name}
            </span>
            <span className="text-[11px] text-[#bbb] dark:text-gray-600 font-medium tabular-nums">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="w-5 h-5 flex items-center justify-center rounded-md text-[#ccc] hover:text-[#666] hover:bg-[#f3f3f3] dark:text-gray-600 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={`flex flex-col gap-1.5 px-3 pb-3 min-h-[40px] rounded-lg transition-colors ${
              isOver ? "bg-indigo-50/60 dark:bg-indigo-950/30" : ""
            }`}
          >
            {tasks.length === 0 ? (
              <div className="px-1 py-3 text-center text-[12px] text-[#ddd] dark:text-gray-700">
                No tasks
              </div>
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} listColor={list.color} />)
            )}
          </div>
        </SortableContext>
      </div>

      <AddTaskModal open={addOpen} defaultListId={list.id} onClose={() => setAddOpen(false)} />
    </>
  );
}
