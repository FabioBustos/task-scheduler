import { EventEmitter } from 'events';
import { Task } from '../models/task.model';
import { Worker, WorkerModel } from '../models/worker.model';
import { SchedulerMetrics, SchedulerResult } from '../interfaces/scheduler.interfaces';

export abstract class BaseTaskScheduler {
  protected workers: WorkerModel[];
  protected taskQueue: Task[] = [];
  protected completedTasks: Task[] = [];
  protected failedTasks: Task[] = [];
  protected failedTasksHistory: number = 0;
  protected eventEmitter: EventEmitter;
  protected workerTaskHistory: Record<string, number[]> = {};
  protected startTime: number = 0;

  constructor(workers: Worker[]) {
    this.workers = workers.map(w => new WorkerModel(w.id, w.capacity));
    this.eventEmitter = new EventEmitter();
    this.setupEventListeners();
  }

  abstract get strategyName(): string;
  
  protected abstract selectWorker(assignments: Record<string, number[]>): WorkerModel | null;

  private setupEventListeners() {
    this.eventEmitter.on('taskCompleted', (worker: WorkerModel, task: Task) => {
      worker.removeTask(task.id);
      this.completedTasks.push(task);
      this.checkAndAssignTasks();
    });

    this.eventEmitter.on('taskFailed', (worker: WorkerModel, task: Task) => {
      worker.removeTask(task.id);
      this.failedTasks.push(task);
      this.failedTasksHistory += 1;
      this.taskQueue.push(task);
      this.checkAndAssignTasks();
    });
  }

  protected async executeTask(task: Task): Promise<string> {
    return new Promise((resolve, reject) => {
      const failProbability = 0.1;
      setTimeout(() => {
        if (Math.random() < failProbability) {
          reject(new Error(`Task ${task.id} failed`));
        } else {
          resolve(`Task ${task.id} completed`);
        }
      }, task.cost);
    });
  }

  protected checkAndAssignTasks() {
    const assignments: Record<string, number[]> = {};

    while (this.taskQueue.length > 0) {
      const worker = this.selectWorker(assignments);
      if (!worker) break;

      const task = this.taskQueue.shift()!;
      worker.addTask(task);
      
      // Actualizar el historial de tareas del worker
      this.workerTaskHistory[worker.id] = this.workerTaskHistory[worker.id] || [];
      this.workerTaskHistory[worker.id].push(task.id);
      
      assignments[worker.id] = assignments[worker.id] || [];
      assignments[worker.id].push(task.id);

      this.executeTask(task)
        .then((result) => {
          this.eventEmitter.emit('taskCompleted', worker, task);
        })
        .catch(() => {
          this.eventEmitter.emit('taskFailed', worker, task);
        });
    }
  }

  async scheduleTasks(tasks: Task[]): Promise<SchedulerResult> {
    this.startTime = Date.now();
    const assignments: Record<string, number[]> = {};

    // Inicializar el historial de tareas para cada worker
    for (const worker of this.workers) {
      this.workerTaskHistory[worker.id] = [];
    }

    this.taskQueue = [...tasks];
    this.checkAndAssignTasks();

    return new Promise<SchedulerResult>((resolve) => {
      const checkCompletion = () => {
        if (this.taskQueue.length === 0 && 
           this.workers.every(worker => worker.currentTaskCount === 0)) {
          
          const metrics = this.calculateMetrics(tasks, assignments);

          // Aseguramos que el workerTaskHistory esté en el resultado
          resolve({
            assignments,
            results: this.completedTasks.map(task => `Task ${task.id} completed`),
            metrics,
            workerTaskHistory: this.workerTaskHistory,
            strategyName: this.strategyName
          });
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  protected calculateMetrics(
    tasks: Task[], 
    assignments: Record<string, number[]>
  ): SchedulerMetrics {
    const completedTasks = this.completedTasks.length;
    const failedTasks = this.failedTasks.length;

    const workerUtilization: Record<string, number> = {};
    this.workers.forEach(worker => {
      workerUtilization[worker.id] = 
        (assignments[worker.id]?.length || 0) / worker.capacity * 100;
    });

    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      failedTasksHistory: this.failedTasksHistory,
      successRate: (completedTasks / tasks.length) * 100,
      avgExecutionTime: tasks.reduce((sum, task) => sum + task.cost, 0) / tasks.length,
      workerUtilization,
      strategyName: this.strategyName,
      executionTimeMs: Date.now() - this.startTime
    };
  }
}


