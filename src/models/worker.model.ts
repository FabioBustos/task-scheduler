import { Task } from './task.model';

export interface Worker {
  id: string;
  capacity: number;
}

export class WorkerModel implements Worker {
  private currentTasks: Task[] = [];
  private assignedTasks: number[] = []; // Propiedad privada

  constructor(
    public id: string,
    public capacity: number
  ) {}

  public get currentTaskCount(): number {
    return this.currentTasks.length;
  }

  /**
   * Agrega una tarea a la lista de tareas asignadas y, si hay capacidad, a las tareas actuales.
   * @param task La tarea a agregar.
   */
  public addTask(task: Task): void {
    this.assignedTasks.push(task.id); // Agrega la tarea a la lista de tareas asignadas

    if (this.currentTasks.length < this.capacity) {
      this.currentTasks.push(task);
    } else {
      console.warn(`Worker ${this.id} is at full capacity. Cannot add task ${task.id}`);
    }
  }

  /**
   * Elimina una tarea de las tareas actuales y de las tareas asignadas.
   * @param taskId El ID de la tarea a eliminar.
   */
  public removeTask(taskId: number): void {
    this.currentTasks = this.currentTasks.filter(t => t.id !== taskId);
    //this.assignedTasks = this.assignedTasks.filter(id => id !== taskId);
  }

  public getAssignedTasks():number[]{
    return this.assignedTasks
  }

  public validate(): boolean {
    return this.capacity > 0;
  }
}