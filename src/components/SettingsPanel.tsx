import * as Dialog from "@radix-ui/react-dialog";
import { X, Sun, Moon, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Theme, TaskList, Board } from "@/types";

const PRESET_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#f97316","#06b6d4","#84cc16","#ec4899"];

interface Props { open: boolean; onClose: () => void; }

export function SettingsPanel({ open, onClose }: Props) {
  const [tab, setTab] = useState<"appearance" | "boards">("appearance");
  const { theme, setTheme, boards, activeBoardId, lists, addBoard, renameBoard, deleteBoard, addList, updateList, deleteList, setActiveBoard } = useAppStore();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-40" />
        <Dialog.Content
          aria-describedby="settings-desc"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[360px] max-h-[560px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40",
            "border border-[#e5e5e5] dark:border-gray-700 flex flex-col outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          )}
        >
          <Dialog.Description id="settings-desc" className="sr-only">Settings</Dialog.Description>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] dark:border-gray-800 shrink-0">
            <span className="text-[14px] font-semibold text-[#111] dark:text-gray-100">Settings</span>
            <Dialog.Close asChild>
              <button aria-label="Close" className="w-6 h-6 flex items-center justify-center rounded-lg text-[#999] dark:text-gray-500 hover:text-[#111] dark:hover:text-gray-200 hover:bg-[#f3f3f3] dark:hover:bg-gray-800 transition-colors">
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 pb-0 shrink-0">
            {(["appearance", "boards"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  "px-3 h-7 rounded-lg text-[12px] font-medium transition-colors capitalize",
                  tab === t
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-[#999] dark:text-gray-500 hover:text-[#666] dark:hover:text-gray-300 hover:bg-[#f3f3f3] dark:hover:bg-gray-800"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {tab === "appearance" && (
              <AppearanceTab theme={theme} setTheme={setTheme} />
            )}
            {tab === "boards" && (
              <BoardsTab
                boards={boards}
                activeBoardId={activeBoardId}
                lists={lists}
                onSelectBoard={setActiveBoard}
                onAddBoard={addBoard}
                onRenameBoard={renameBoard}
                onDeleteBoard={deleteBoard}
                onAddList={addList}
                onUpdateList={updateList}
                onDeleteList={deleteList}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Appearance tab ───────────────────────────────────────────────────────────

function AppearanceTab({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#999] dark:text-gray-500 font-medium uppercase tracking-wider">Theme</p>
      <div className="flex gap-2">
        {([["light", Sun, "Light"], ["dark", Moon, "Dark"]] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTheme(t as Theme)}
            className={cn(
              "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors",
              theme === t
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                : "border-[#e5e5e5] dark:border-gray-700 hover:border-[#d0d0d0] dark:hover:border-gray-600"
            )}
          >
            <Icon size={18} className={theme === t ? "text-indigo-500" : "text-[#999] dark:text-gray-500"} />
            <span className={cn("text-[12px] font-medium", theme === t ? "text-indigo-600 dark:text-indigo-400" : "text-[#666] dark:text-gray-400")}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Boards tab ───────────────────────────────────────────────────────────────

interface BoardsTabProps {
  boards: Board[];
  activeBoardId: string | null;
  lists: TaskList[];
  onSelectBoard: (id: string) => void;
  onAddBoard: (name: string) => void;
  onRenameBoard: (id: string, name: string) => void;
  onDeleteBoard: (id: string) => void;
  onAddList: (name: string, color: string) => void;
  onUpdateList: (id: string, updates: Partial<Pick<TaskList, "name" | "color">>) => void;
  onDeleteList: (id: string) => void;
}

function BoardsTab({ boards, activeBoardId, lists, onSelectBoard, onAddBoard, onRenameBoard, onDeleteBoard, onAddList, onUpdateList, onDeleteList }: BoardsTabProps) {
  const [newBoardName, setNewBoardName] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#6366f1");
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const input = "w-full h-8 px-3 text-[12px] rounded-lg bg-[#f8f8f8] dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 text-[#111] dark:text-gray-100 outline-none placeholder:text-[#bbb] dark:placeholder:text-gray-600 focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors";

  return (
    <div className="space-y-5">
      {/* Board selector */}
      <div>
        <p className="text-[12px] text-[#999] dark:text-gray-500 font-medium uppercase tracking-wider mb-2">Boards</p>
        <div className="space-y-1">
          {boards.map((b) => (
            <div key={b.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl group", b.id === activeBoardId ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-[#f8f8f8] dark:hover:bg-gray-800")}>
              {editingBoardId === b.id ? (
                <input autoFocus className={cn(input, "flex-1")} value={editingBoardName}
                  onChange={(e) => setEditingBoardName(e.target.value)}
                  onBlur={() => { onRenameBoard(b.id, editingBoardName || b.name); setEditingBoardId(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditingBoardId(null); }}
                />
              ) : (
                <>
                  <button className="flex-1 text-left text-[13px] font-medium text-[#111] dark:text-gray-100" onClick={() => onSelectBoard(b.id)}>
                    {b.name}
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingBoardId(b.id); setEditingBoardName(b.name); }} className="w-6 h-6 flex items-center justify-center rounded-md text-[#aaa] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      <Pencil size={11} />
                    </button>
                    {boards.length > 1 && (
                      <button onClick={() => onDeleteBoard(b.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#aaa] dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input className={cn(input, "flex-1")} placeholder="New board name…" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newBoardName.trim()) { onAddBoard(newBoardName.trim()); setNewBoardName(""); } }}
          />
          <button onClick={() => { if (newBoardName.trim()) { onAddBoard(newBoardName.trim()); setNewBoardName(""); } }}
            className="h-8 px-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-medium transition-colors flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Lists for active board */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <p className="text-[12px] text-[#999] dark:text-gray-500 font-medium uppercase tracking-wider">Lists</p>
          <ChevronDown size={11} className="text-[#bbb] dark:text-gray-600" />
          <span className="text-[12px] text-[#bbb] dark:text-gray-600">{boards.find(b => b.id === activeBoardId)?.name}</span>
        </div>
        <div className="space-y-1">
          {lists.map((l) => (
            <div key={l.id} className="flex items-center gap-2 px-3 py-2 rounded-xl group hover:bg-[#f8f8f8] dark:hover:bg-gray-800">
              {editingListId === l.id ? (
                <ListEditor list={l} onSave={(updates) => { onUpdateList(l.id, updates); setEditingListId(null); }} onCancel={() => setEditingListId(null)} />
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="flex-1 text-[13px] text-[#111] dark:text-gray-100">{l.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingListId(l.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#aaa] dark:text-gray-600 hover:text-[#666] dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      <Pencil size={11} />
                    </button>
                    {lists.length > 1 && (
                      <button onClick={() => onDeleteList(l.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#aaa] dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {/* Add list */}
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input className={cn(input, "flex-1")} placeholder="New list name…" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
            <div className="flex gap-1 items-center">
              {PRESET_COLORS.slice(0, 5).map((c) => (
                <button key={c} onClick={() => setNewListColor(c)}
                  className={cn("w-5 h-5 rounded-full border-2 transition-all", newListColor === c ? "border-gray-400 scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (newListName.trim()) { onAddList(newListName.trim(), newListColor); setNewListName(""); } }}
            disabled={!newListName.trim()}
            className="w-full h-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#e5e5e5] dark:disabled:bg-gray-800 disabled:text-[#bbb] text-white text-[12px] font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Add list
          </button>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ list, onSave, onCancel }: { list: TaskList; onSave: (u: Partial<Pick<TaskList, "name" | "color">>) => void; onCancel: () => void }) {
  const [name, setName] = useState(list.name);
  const [color, setColor] = useState(list.color);
  return (
    <div className="flex-1 flex items-center gap-2">
      <input autoFocus className="flex-1 h-7 px-2 text-[12px] rounded-lg bg-[#f8f8f8] dark:bg-gray-700 border border-indigo-300 outline-none text-[#111] dark:text-gray-100"
        value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave({ name: name.trim() || list.name, color }); if (e.key === "Escape") onCancel(); }}
      />
      <div className="flex gap-1">
        {PRESET_COLORS.slice(0, 5).map((c) => (
          <button key={c} onClick={() => setColor(c)}
            className={cn("w-4 h-4 rounded-full border-2 transition-all", color === c ? "border-gray-400 scale-110" : "border-transparent")}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <button onClick={() => onSave({ name: name.trim() || list.name, color })} className="text-[11px] text-indigo-500 font-medium">Save</button>
    </div>
  );
}
