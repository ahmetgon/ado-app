/**
 * Central store for boards, lists, tasks, and theme.
 * All mutations optimistically update local state, then persist to SQLite.
 */
import { create } from "zustand";
import {
  dbLoadBoards, dbCreateBoard, dbRenameBoard, dbDeleteBoard,
  dbLoadLists, dbCreateList, dbUpdateList, dbDeleteList,
  dbLoadTasks, dbInsertTask, dbUpdateTask, dbDeleteTask, dbUpdateTaskSortOrders,
  dbGetSetting, dbSetSetting,
} from "@/lib/db";
import type { Board, TaskList, Task, Priority, Theme } from "@/types";

interface AppStore {
  // ── state ──────────────────────────────────────────────────────
  boards: Board[];
  lists: TaskList[];
  tasks: Task[];
  activeBoardId: string | null;
  theme: Theme;
  loaded: boolean;

  // ── bootstrap ─────────────────────────────────────────────────
  init: () => Promise<void>;
  setActiveBoard: (id: string) => Promise<void>;

  // ── boards ────────────────────────────────────────────────────
  addBoard: (name: string) => Promise<void>;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => Promise<void>;

  // ── lists ─────────────────────────────────────────────────────
  addList: (name: string, color: string) => Promise<void>;
  updateList: (id: string, updates: Partial<Pick<TaskList, "name" | "color">>) => void;
  deleteList: (id: string) => void;

  // ── tasks ─────────────────────────────────────────────────────
  addTask: (task: Omit<Task, "id" | "createdAt" | "sortOrder" | "boardId">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;

  // ── theme ─────────────────────────────────────────────────────
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  boards: [],
  lists: [],
  tasks: [],
  activeBoardId: null,
  theme: "light",
  loaded: false,

  init: async () => {
    const boards = await dbLoadBoards();
    const savedBoardId = await dbGetSetting("activeBoardId");
    const theme = (await dbGetSetting("theme") ?? "light") as Theme;

    const activeBoardId =
      boards.find((b) => b.id === savedBoardId)?.id ?? boards[0]?.id ?? null;

    applyTheme(theme);

    if (!activeBoardId) {
      set({ boards, lists: [], tasks: [], activeBoardId, theme, loaded: true });
      return;
    }

    const [lists, tasks] = await Promise.all([
      dbLoadLists(activeBoardId),
      dbLoadTasks(activeBoardId),
    ]);
    set({ boards, lists, tasks, activeBoardId, theme, loaded: true });
  },

  setActiveBoard: async (id) => {
    const [lists, tasks] = await Promise.all([dbLoadLists(id), dbLoadTasks(id)]);
    set({ activeBoardId: id, lists, tasks });
    dbSetSetting("activeBoardId", id);
  },

  // ── boards ────────────────────────────────────────────────────

  addBoard: async (name) => {
    const board = await dbCreateBoard(name);
    const defaultLists = await dbLoadLists(board.id);
    set((s) => ({ boards: [...s.boards, board], activeBoardId: board.id, lists: defaultLists, tasks: [] }));
    dbSetSetting("activeBoardId", board.id);
  },

  renameBoard: (id, name) => {
    set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, name } : b)) }));
    dbRenameBoard(id, name);
  },

  deleteBoard: async (id) => {
    await dbDeleteBoard(id);
    const boards = get().boards.filter((b) => b.id !== id);
    const newActive = boards[0]?.id ?? null;
    if (newActive) {
      const [lists, tasks] = await Promise.all([dbLoadLists(newActive), dbLoadTasks(newActive)]);
      set({ boards, activeBoardId: newActive, lists, tasks });
    } else {
      set({ boards, activeBoardId: null, lists: [], tasks: [] });
    }
  },

  // ── lists ─────────────────────────────────────────────────────

  addList: async (name, color) => {
    const { activeBoardId } = get();
    if (!activeBoardId) return;
    const list = await dbCreateList(activeBoardId, name, color);
    set((s) => ({ lists: [...s.lists, list] }));
  },

  updateList: (id, updates) => {
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)) }));
    dbUpdateList(id, updates);
  },

  deleteList: (id) => {
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      tasks: s.tasks.filter((t) => t.listId !== id),
    }));
    dbDeleteList(id);
  },

  // ── tasks ─────────────────────────────────────────────────────

  addTask: (task) => {
    const { activeBoardId, tasks } = get();
    if (!activeBoardId) return;
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      boardId: activeBoardId,
      createdAt: new Date().toISOString(),
      sortOrder: tasks.length,
    };
    set((s) => ({ tasks: [...s.tasks, newTask] }));
    dbInsertTask(newTask);
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, id: t.id, createdAt: t.createdAt } : t
      ),
    }));
    dbUpdateTask(id, updates);
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    dbDeleteTask(id);
  },

  setTasks: (tasks) => {
    set({ tasks });
    dbUpdateTaskSortOrders(tasks);
  },

  archiveTask: (id) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, archived: true } : t)) }));
    dbUpdateTask(id, { archived: true });
  },

  restoreTask: (id) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, archived: false } : t)) }));
    dbUpdateTask(id, { archived: false });
  },

  // ── theme ─────────────────────────────────────────────────────

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    dbSetSetting("theme", theme);
  },
}));

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// ── Selectors ────────────────────────────────────────────────────────────────

export function useActiveTasks(listId?: string) {
  const tasks = useAppStore((s) => s.tasks);
  const active = tasks.filter((t) => !t.archived);
  if (!listId) return active;
  return active.filter((t) => t.listId === listId);
}

export function useArchivedTasks() {
  return useAppStore((s) => s.tasks.filter((t) => t.archived));
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  high:   { label: "High",   dot: "bg-red-400" },
  medium: { label: "Medium", dot: "bg-amber-400" },
  low:    { label: "Low",    dot: "bg-slate-300" },
};
