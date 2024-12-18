import { Task } from './task.model';

export interface Worker {
  id: string;
  capacity: number;
}

export class WorkerModel implements Worker {
  private currentTasks: Task[] = [];

  constructor(
    public id: string,
    public capacity: number
  ) {}

  public get currentTaskCount(): number {
    return this.currentTasks.length;
  }
  
  public addTask(task: Task): void {
    if (this.currentTasks.length < this.capacity) {
      this.currentTasks.push(task);
    } else {
      // Handle the case where the worker is at full capacity
      // You might want to log a warning or queue the task for later
      console.warn(`Worker ${this.id} is at full capacity. Cannot add task ${task.id}`);
    }
  }

  public removeTask(taskId: number): void {
    this.currentTasks = this.currentTasks.filter(t => t.id !== taskId);
  }

  public validate(): boolean {
    return this.capacity > 0;
  }
}