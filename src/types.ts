export type Priority = "low" | "medium" | "high";
export type Theme = "light" | "dark";

export interface Board {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface TaskList {
  id: string;
  board_id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface Task {
  id: string;
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  archived?: boolean;
  sortOrder: number;
}
