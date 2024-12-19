import { Task, TaskPriority, TaskType } from '../models/task.model';

export function generateRandomTasks(n: number): Task[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    cost: Math.floor(Math.random() * 100) + 1,
    priority: Object.values(TaskPriority)[Math.floor(Math.random() * 3)],
    type: Object.values(TaskType)[Math.floor(Math.random() * 2)]
  }));
}