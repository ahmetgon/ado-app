import { useState, useEffect } from "react";
import { Plus, CheckSquare, Archive, Pin, Settings } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task } from "@/types";
import { Column } from "@/components/Column";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import { ArchivePanel } from "@/components/ArchivePanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pinned, setPinned] = useState(false);

  const { boards, lists, tasks, activeBoardId, loaded, init, setActiveBoard, setTasks } = useAppStore();
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const activeTasks = tasks.filter((t) => !t.archived);
  const done = activeTasks.filter((t) => {
    const doneList = lists[lists.length - 1];
    return doneList && t.listId === doneList.id;
  }).length;

  useEffect(() => { init(); }, [init]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !addOpen && !settingsOpen) getCurrentWindow().hide();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen, settingsOpen]);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    invoke("set_pinned", { pinned: next });
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverList = lists.some((l) => l.id === overId);
    if (isOverList && activeTask.listId !== overId) {
      setTasks(tasks.map((t) => t.id === activeId ? { ...t, listId: overId } : t));
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.listId !== overTask.listId) {
      setTasks(tasks.map((t) => t.id === activeId ? { ...t, listId: overTask.listId } : t));
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;
    const activeIdx = tasks.findIndex((t) => t.id === activeId);
    const overIdx = tasks.findIndex((t) => t.id === overId);
    if (overIdx !== -1) setTasks(arrayMove(tasks, activeIdx, overIdx));
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] dark:bg-gray-950">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="flex flex-col h-screen bg-[#fafafa] dark:bg-gray-950 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f0f0f0] dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-indigo-500" />
            <span className="text-[14px] font-bold text-[#111] dark:text-gray-100 tracking-tight">
              {activeBoard?.name ?? "A-do"}
            </span>
            {activeTasks.length > 0 && (
              <span className="text-[11px] text-[#bbb] dark:text-gray-600 font-medium">
                {done}/{activeTasks.length}
              </span>
            )}
          </div>

          {/* Board switcher (if multiple boards) */}
          {boards.length > 1 && (
            <div className="flex-1 flex justify-center px-2">
              <select
                className="h-6 px-2 text-[11px] rounded-lg bg-transparent dark:text-gray-400 text-[#999] outline-none cursor-pointer border-none"
                value={activeBoardId ?? ""}
                onChange={(e) => setActiveBoard(e.target.value)}
              >
                {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-medium transition-colors"
            >
              <Plus size={13} /> Add
            </button>
            <button onClick={togglePin}
              className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${pinned ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100" : "text-[#ccc] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-[#f3f3f3] dark:hover:bg-gray-800"}`}
              title={pinned ? "Unpin window" : "Pin on top"}>
              <Pin size={13} className={pinned ? "fill-indigo-500" : ""} />
            </button>
            <button onClick={() => setArchiveOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#ccc] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors"
              title="Archive">
              <Archive size={14} />
            </button>
            <button onClick={() => setSettingsOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#ccc] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors"
              title="Settings">
              <Settings size={14} />
            </button>
            <button onClick={() => getCurrentWindow().hide()}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#ccc] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors text-[17px] leading-none"
              title="Hide (Esc)">
              ×
            </button>
          </div>
        </div>

        {/* Kanban lists */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {lists.map((list, i) => (
            <div key={list.id}>
              <Column list={list} />
              {i < lists.length - 1 && <div className="mx-4 border-t border-[#f0f0f0] dark:border-gray-800" />}
            </div>
          ))}
        </div>
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ArchivePanel open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 opacity-90 pointer-events-none">
            <TaskCard task={activeTask} listColor={lists.find(l => l.id === activeTask.listId)?.color ?? "#6366f1"} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
