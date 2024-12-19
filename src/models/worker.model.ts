import { Task } from './task.model';

export interface Worker {
  id: string;
  capacity: number;
}

export class WorkerModel implements Worker {
  private currentTasks: Task[] = [];
  private assignedTasks: number[] = [];

  constructor(
    public id: string,
    public capacity: number
  ) {}

  public get currentTaskCount(): number {
    return this.currentTasks.length;
  }

  public addTask(task: Task): void {
    this.assignedTasks.push(task.id);
    if (this.currentTasks.length < this.capacity) {
      this.currentTasks.push(task);
    }
  }

  public removeTask(taskId: number): void {
    this.currentTasks = this.currentTasks.filter(t => t.id !== taskId);
  }

  public getAssignedTasks(): number[] {
    return this.assignedTasks;
  }
}