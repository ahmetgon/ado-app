import * as Dialog from "@radix-ui/react-dialog";
import { X, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArchivedTasks, useAppStore, PRIORITY_CONFIG } from "@/store/useAppStore";

interface Props { open: boolean; onClose: () => void; }

export function ArchivePanel({ open, onClose }: Props) {
  const archived = useArchivedTasks();
  const { restoreTask, deleteTask } = useAppStore();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-40" />
        <Dialog.Content
          aria-describedby="archive-desc"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[340px] max-h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40",
            "border border-[#e5e5e5] dark:border-gray-700 flex flex-col outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <Dialog.Description id="archive-desc" className="sr-only">Archived tasks</Dialog.Description>

          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] dark:border-gray-800 shrink-0">
            <span className="text-[14px] font-semibold text-[#111] dark:text-gray-100">Archive</span>
            <div className="flex items-center gap-2">
              {archived.length > 0 && (
                <span className="text-[11px] text-[#bbb] dark:text-gray-600 font-medium tabular-nums">{archived.length}</span>
              )}
              <Dialog.Close asChild>
                <button aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#999] dark:text-gray-500 hover:text-[#111] dark:hover:text-gray-200 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors">
                  <X size={14} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
            {archived.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#ccc] dark:text-gray-700">No archived tasks</div>
            ) : archived.map((task) => {
              const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
              return (
                <div key={task.id} className="flex items-start gap-2 bg-[#f8f8f8] dark:bg-gray-800 rounded-xl px-3 py-2.5 group">
                  <span className={cn("mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full", priority.dot)} />
                  <span className="flex-1 text-[13px] text-[#666] dark:text-gray-400 leading-snug line-clamp-2">{task.title}</span>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button aria-label="Restore task" onClick={() => restoreTask(task.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-[#aaa] dark:text-gray-600 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors">
                      <RotateCcw size={12} />
                    </button>
                    <button aria-label="Delete task permanently" onClick={() => deleteTask(task.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-[#aaa] dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
