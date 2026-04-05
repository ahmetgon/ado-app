import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, Calendar, Archive } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore, PRIORITY_CONFIG } from "@/store/useAppStore";
import { DescriptionView } from "./DescriptionView";
import type { Task, Priority } from "@/types";

interface Props { task: Task; listColor: string; open: boolean; onClose: () => void; }

export function TaskDetail({ task, open, onClose }: Props) {
  const { lists, updateTask, deleteTask, archiveTask } = useAppStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setEditingDesc(false);
  }, [task.id, task.title, task.description]);

  function saveText() {
    const trimmed = title.trim();
    updateTask(task.id, { title: trimmed || task.title, description });
  }

  function saveDesc() {
    updateTask(task.id, { description });
    setEditingDesc(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-40" />
        <Dialog.Content
          aria-describedby="task-detail-desc"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[340px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40",
            "border border-[#e5e5e5] dark:border-gray-700 p-5 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <Dialog.Description id="task-detail-desc" className="sr-only">Edit task details</Dialog.Description>

          <div className="flex items-start justify-between gap-2 mb-4">
            <input
              aria-label="Task title"
              className="flex-1 text-[15px] font-semibold text-[#111] dark:text-gray-100 bg-transparent outline-none leading-snug placeholder:text-[#aaa]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveText}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <Dialog.Close asChild>
              <button aria-label="Close" className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#999] dark:text-gray-500 hover:text-[#111] dark:hover:text-gray-200 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors">
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {editingDesc ? (
            <textarea
              aria-label="Description"
              autoFocus
              className="w-full min-h-[80px] text-[13px] text-[#444] dark:text-gray-300 bg-[#f8f8f8] dark:bg-gray-800 rounded-xl p-3 outline-none resize-none leading-relaxed placeholder:text-[#bbb] dark:placeholder:text-gray-600 border border-[#e0e0e0] dark:border-gray-700 transition-colors"
              placeholder="Add a description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDesc}
            />
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className={cn(
                "min-h-[44px] rounded-xl p-3 cursor-text transition-colors",
                "bg-[#f8f8f8] dark:bg-gray-800 hover:bg-[#f3f3f3] dark:hover:bg-gray-750",
                !description && "flex items-center"
              )}
            >
              {description ? <DescriptionView text={description} /> : (
                <span className="text-[13px] text-[#bbb] dark:text-gray-600">Add a description…</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <select
              aria-label="Priority"
              className="flex-1 h-8 px-2 rounded-lg text-[12px] bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#444] dark:text-gray-300 outline-none cursor-pointer"
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
            >
              {(["high", "medium", "low"] as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label} priority</option>
              ))}
            </select>

            <select
              aria-label="List"
              className="flex-1 h-8 px-2 rounded-lg text-[12px] bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#444] dark:text-gray-300 outline-none cursor-pointer"
              value={task.listId}
              onChange={(e) => updateTask(task.id, { listId: e.target.value })}
            >
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Calendar size={13} className="text-[#aaa] dark:text-gray-600 shrink-0" />
            <input
              type="date"
              aria-label="Due date"
              className="flex-1 h-8 px-2 rounded-lg text-[12px] bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#444] dark:text-gray-300 outline-none cursor-pointer"
              value={task.dueDate ?? ""}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
            />
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f0f0] dark:border-gray-800">
            <span className="text-[11px] text-[#bbb] dark:text-gray-600">
              {new Date(task.createdAt).toLocaleDateString("tr-TR")}
            </span>
            <div className="flex items-center gap-3">
              <button aria-label="Archive task" onClick={() => { archiveTask(task.id); onClose(); }}
                className="flex items-center gap-1 text-[12px] text-[#aaa] dark:text-gray-500 hover:text-[#666] dark:hover:text-gray-300 transition-colors">
                <Archive size={13} /> Archive
              </button>
              <button aria-label="Delete task" onClick={() => { deleteTask(task.id); onClose(); }}
                className="flex items-center gap-1 text-[12px] text-red-400 hover:text-red-500 transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
