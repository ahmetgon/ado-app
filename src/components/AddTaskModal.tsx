import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Priority } from "@/types";

interface Props {
  open: boolean;
  defaultListId?: string;
  onClose: () => void;
}

export function AddTaskModal({ open, defaultListId, onClose }: Props) {
  const { lists, addTask } = useAppStore();
  const [title, setTitle] = useState("");
  const [listId, setListId] = useState(defaultListId ?? lists[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("medium");

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({ title: trimmed, listId, priority });
    setTitle("");
    setPriority("medium");
    onClose();
  }

  const select = "flex-1 h-8 px-2 rounded-lg text-[12px] bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#444] dark:text-gray-300 outline-none cursor-pointer";

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-40" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[320px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40",
            "border border-[#e5e5e5] dark:border-gray-700 p-5 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-[14px] font-semibold text-[#111] dark:text-gray-100">New task</Dialog.Title>
            <Dialog.Close asChild>
              <button className="w-6 h-6 flex items-center justify-center rounded-lg text-[#999] dark:text-gray-500 hover:text-[#111] dark:hover:text-gray-200 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors">
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          <input
            autoFocus
            className="w-full h-9 px-3 text-[13px] rounded-xl bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#111] dark:text-gray-100 outline-none placeholder:text-[#bbb] dark:placeholder:text-gray-600 focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
            placeholder="Task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />

          <div className="flex gap-2 mt-3">
            <select className={select} value={listId} onChange={(e) => setListId(e.target.value)}>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className={select} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="w-full mt-4 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#e5e5e5] dark:disabled:bg-gray-800 disabled:text-[#bbb] dark:disabled:text-gray-600 text-white text-[13px] font-medium transition-colors"
          >
            Add task
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
