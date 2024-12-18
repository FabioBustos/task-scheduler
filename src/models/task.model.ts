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

export class TaskModel implements Task {
  constructor(
    public id: number,
    public cost: number,
    public priority: TaskPriority,
    public type: TaskType
  ) {}

  validate(): boolean {
    return this.cost > 0 && 
           Object.values(TaskPriority).includes(this.priority) && 
           Object.values(TaskType).includes(this.type);
  }
}