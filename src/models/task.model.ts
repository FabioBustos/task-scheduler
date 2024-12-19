export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskType {
  CPU = 'CPU',
  IO = 'IO'
}

export interface Task {
  id: number;
  cost: number;
  priority: TaskPriority;
  type: TaskType;
}