import Database from "@tauri-apps/plugin-sql";
import type { Task, Board, TaskList, Priority } from "@/types";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:ado.db");
    await db.execute("PRAGMA journal_mode=WAL");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS boards (
        id         TEXT    PRIMARY KEY,
        name       TEXT    NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lists (
        id         TEXT    PRIMARY KEY,
        board_id   TEXT    NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        name       TEXT    NOT NULL,
        color      TEXT    NOT NULL DEFAULT '#6366f1',
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id         TEXT    PRIMARY KEY,
        board_id   TEXT    NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        list_id    TEXT    NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
        title      TEXT    NOT NULL,
        description TEXT,
        priority   TEXT    NOT NULL DEFAULT 'medium',
        due_date   TEXT,
        archived   INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    // Seed default board if none exist
    const boards = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM boards");
    if (boards[0].count === 0) {
      await seedDefaultBoard(db);
    }
  }
  return db;
}

async function seedDefaultBoard(db: Database) {
  const boardId = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO boards (id, name, sort_order, created_at) VALUES ($1, $2, 0, $3)",
    [boardId, "My Board", now]
  );
  const defaultLists = [
    { name: "To Do", color: "#6366f1" },
    { name: "In Progress", color: "#f59e0b" },
    { name: "Done", color: "#10b981" },
  ];
  for (let i = 0; i < defaultLists.length; i++) {
    await db.execute(
      "INSERT INTO lists (id, board_id, name, color, sort_order) VALUES ($1, $2, $3, $4, $5)",
      [crypto.randomUUID(), boardId, defaultLists[i].name, defaultLists[i].color, i]
    );
  }
}

// ── Boards ──────────────────────────────────────────────────────────────────

export async function dbLoadBoards(): Promise<Board[]> {
  const db = await getDb();
  return db.select<Board[]>("SELECT * FROM boards ORDER BY sort_order ASC, created_at ASC");
}

export async function dbCreateBoard(name: string): Promise<Board> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const count = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM boards");
  await db.execute(
    "INSERT INTO boards (id, name, sort_order, created_at) VALUES ($1, $2, $3, $4)",
    [id, name, count[0].count, now]
  );
  return { id, name, sort_order: count[0].count, created_at: now };
}

export async function dbRenameBoard(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE boards SET name = $1 WHERE id = $2", [name, id]);
}

export async function dbDeleteBoard(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM boards WHERE id = $1", [id]);
}

// ── Lists ────────────────────────────────────────────────────────────────────

export async function dbLoadLists(boardId: string): Promise<TaskList[]> {
  const db = await getDb();
  return db.select<TaskList[]>(
    "SELECT * FROM lists WHERE board_id = $1 ORDER BY sort_order ASC",
    [boardId]
  );
}

export async function dbCreateList(boardId: string, name: string, color: string): Promise<TaskList> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM lists WHERE board_id = $1", [boardId]
  );
  await db.execute(
    "INSERT INTO lists (id, board_id, name, color, sort_order) VALUES ($1, $2, $3, $4, $5)",
    [id, boardId, name, color, rows[0].count]
  );
  return { id, board_id: boardId, name, color, sort_order: rows[0].count };
}

export async function dbUpdateList(id: string, updates: Partial<Pick<TaskList, "name" | "color">>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
  if (updates.color !== undefined) { fields.push(`color = $${idx++}`); values.push(updates.color); }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE lists SET ${fields.join(", ")} WHERE id = $${idx}`, values);
}

export async function dbDeleteList(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM lists WHERE id = $1", [id]);
}

// ── Tasks ────────────────────────────────────────────────────────────────────

interface TaskRow {
  id: string; board_id: string; list_id: string; title: string;
  description: string | null; priority: string; due_date: string | null;
  archived: number; created_at: string; sort_order: number;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id, boardId: row.board_id, listId: row.list_id,
    title: row.title, description: row.description ?? undefined,
    priority: row.priority as Priority, dueDate: row.due_date ?? undefined,
    archived: row.archived === 1, createdAt: row.created_at, sortOrder: row.sort_order,
  };
}

export async function dbLoadTasks(boardId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.select<TaskRow[]>(
    "SELECT * FROM tasks WHERE board_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [boardId]
  );
  return rows.map(rowToTask);
}

export async function dbInsertTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO tasks (id, board_id, list_id, title, description, priority, due_date, archived, created_at, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [task.id, task.boardId, task.listId, task.title, task.description ?? null,
     task.priority, task.dueDate ?? null, task.archived ? 1 : 0, task.createdAt, task.sortOrder]
  );
}

export async function dbUpdateTask(id: string, updates: Partial<Task>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (updates.listId !== undefined)    { fields.push(`list_id = $${idx++}`);    values.push(updates.listId); }
  if (updates.title !== undefined)     { fields.push(`title = $${idx++}`);      values.push(updates.title); }
  if ("description" in updates)        { fields.push(`description = $${idx++}`); values.push(updates.description ?? null); }
  if (updates.priority !== undefined)  { fields.push(`priority = $${idx++}`);   values.push(updates.priority); }
  if ("dueDate" in updates)            { fields.push(`due_date = $${idx++}`);   values.push(updates.dueDate ?? null); }
  if (updates.archived !== undefined)  { fields.push(`archived = $${idx++}`);   values.push(updates.archived ? 1 : 0); }
  if (updates.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(updates.sortOrder); }
  if (!fields.length) return;
  values.push(id);
  await db.execute(`UPDATE tasks SET ${fields.join(", ")} WHERE id = $${idx}`, values);
}

export async function dbDeleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
}

export async function dbUpdateTaskSortOrders(tasks: Task[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < tasks.length; i++) {
    await db.execute("UPDATE tasks SET sort_order = $1 WHERE id = $2", [i, tasks[i].id]);
  }
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function dbGetSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1", [key]
  );
  return rows[0]?.value ?? null;
}

export async function dbSetSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
    [key, value]
  );
}
