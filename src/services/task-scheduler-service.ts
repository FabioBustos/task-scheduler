import { Task, TaskModel, TaskPriority, TaskType } from '../models/task.model';
import { Worker, WorkerModel } from '../models/worker.model';
import { loggerService } from '../utils/logger';
import { EventEmitter } from 'events';

interface CacheEntry {
  successCount: number;
  lastSuccessfulCost: number;
  averageExecutionTime: number;
}

interface SchedulerMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
  successRate: number;
  workerUtilization: Record<string, number>;
}

interface SchedulerResult {
  assignments: Record<string, number[]>;
  results: string[];
  metrics: SchedulerMetrics;
}

export class TaskSchedulerService {
  private workers: WorkerModel[];
  private cache: Map<string, CacheEntry>;
  private cacheTimestamps: Map<string, number>;
  private taskQueue: Task[] = [];
  private completedTasks: Task[] = [];
  private failedTasks: Task[] = [];
  private eventEmitter: EventEmitter;

  // Configuración ajustable
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache validity
  private readonly BATCH_SIZE = 10;
  private readonly REQUEUE_DELAY_MS = 500;

  constructor(workers: Worker[]) {
    loggerService.info('Initializing TaskSchedulerService', { 
      workerCount: workers.length 
    });

    this.workers = workers.map(w => new WorkerModel(w.id, w.capacity));
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.eventEmitter = new EventEmitter();

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Evento cuando una tarea se completa
    this.eventEmitter.on('taskCompleted', (worker: WorkerModel, task: Task, executionTime: number) => {
      this.logTaskCompletion(worker, task, executionTime);
      this.removeTaskFromWorker(worker, task);
      this.updateCache(task, executionTime);
      this.completedTasks.push(task);
      this.checkAndAssignTasks();
    });

    // Evento cuando una tarea falla
    this.eventEmitter.on('taskFailed', (worker: WorkerModel, task: Task) => {
      this.logTaskFailure(worker, task);
      this.removeTaskFromWorker(worker, task);
      this.failedTasks.push(task);
      this.requeueTask(task);
      this.checkAndAssignTasks();
    });
  }

  private logTaskStart(worker: WorkerModel, task: Task) {
    loggerService.info(`Worker ${worker.id} started task ${task.id}`, {
      taskType: task.type,
      taskPriority: task.priority
    });
  }

  private logTaskCompletion(worker: WorkerModel, task: Task, executionTime: number) {
    loggerService.info(`Worker ${worker.id} completed task ${task.id}`, {
      taskType: task.type,
      taskPriority: task.priority,
      executionTime
    });
  }

  private logTaskFailure(worker: WorkerModel, task: Task) {
    loggerService.warn(`Worker ${worker.id} failed task ${task.id}`, {
      taskType: task.type,
      taskPriority: task.priority
    });
  }

  private removeTaskFromWorker(worker: WorkerModel, task: Task) {
    worker.removeTask(task.id);  // Use the removeTask method
  }

  private requeueTask(task: Task) {
    this.taskQueue.push(task);
  }

  private selectWorker(assignments: Record<string, number[]>): WorkerModel | null {
    return this.workers
      .filter(worker => (assignments[worker.id]?.length || 0) < worker.capacity && worker.currentTaskCount < worker.capacity)
      .sort((a, b) => {
        const loadA = assignments[a.id]?.length || 0;
        const loadB = assignments[b.id]?.length || 0;
        return loadA - loadB;
      })[0] || null;
  }

  private async executeTask(task: Task): Promise<{ result: string, executionTime: number }> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const failProbability = 0.1;
      const willFail = Math.random() < failProbability;

      setTimeout(() => {
        const executionTime = Date.now() - startTime;
        
        if (willFail) {
          reject(new Error(`Task ${task.id} failed`));
        } else {
          resolve({ 
            result: `Task ${task.id} completed`, 
            executionTime 
          });
        }
      }, task.cost);
    });
  }

  private async executeTaskWithRetry(
    task: Task, 
    worker: WorkerModel
  ): Promise<{ result: string, executionTime: number }> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.executeTask(task);
        return result;
      } catch (error) {
        loggerService.warn(`Retry attempt ${attempt} for Task ${task.id}`, {
          workerId: worker.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        if (attempt === this.MAX_RETRIES) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    throw new Error(`Task ${task.id} failed after ${this.MAX_RETRIES} attempts`);
  }

  private checkAndAssignTasks() {
    const assignments: Record<string, number[]> = {};

    while (this.taskQueue.length > 0) {
      const worker = this.selectWorker(assignments);
      
      if (!worker) {
        break;
      }

      const task = this.taskQueue.shift()!;
      
      // Aplicar reducción de costo por caché
      const cachedCostReduction = this.getCachedCostReduction(task);
      const adjustedTask = {
        ...task,
        cost: Math.max(task.cost - cachedCostReduction, task.cost * 0.2)
      };

      worker.addTask(adjustedTask); // Use the public addTask method
      assignments[worker.id] = assignments[worker.id] || [];
      assignments[worker.id].push(task.id);

      this.executeTaskWithRetry(adjustedTask, worker)
        .then(({ result, executionTime }) => {
          this.eventEmitter.emit('taskCompleted', worker, task, executionTime);
        })
        .catch(() => {
          this.eventEmitter.emit('taskFailed', worker, task);
        });
    }
  }

  // Método principal de scheduling
  async scheduleTasks(tasks: Task[]): Promise<SchedulerResult> {
    loggerService.info('Starting task scheduling', { 
      totalTasks: tasks.length 
    });

    const startTime = Date.now();
    const assignments: Record<string, number[]> = {};
    const results: string[] = [];

    // Ordenar tareas por prioridad
    const prioritizedTasks = tasks.sort((a, b) => {
      const priorityOrder = { 
        [TaskPriority.HIGH]: 3, 
        [TaskPriority.MEDIUM]: 2, 
        [TaskPriority.LOW]: 1 
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Inicializar cola de tareas
    this.taskQueue = [...prioritizedTasks];

    // Iniciar procesamiento de tareas
    this.checkAndAssignTasks();

    // Esperar a que todas las tareas se procesen
    return new Promise<SchedulerResult>((resolve) => {
      const checkCompletion = () => {
        if (this.taskQueue.length === 0 && 
           this.workers.every(worker => worker.currentTaskCount === 0)) {
          const metrics = this.calculateMetrics(tasks, 
            this.completedTasks.map(() => 'completed'),
            assignments
          );

          loggerService.info('Task scheduling completed', {
            ...metrics,
            totalExecutionTime: Date.now() - startTime
          });

          resolve({
            assignments, 
            results: this.completedTasks.map(task => `Task ${task.id} completed`),
            metrics
          });
        } else {
          // Continuar verificando
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  // Métodos existentes (getCacheKey, updateCache, etc.) permanecen igual
  private getCacheKey(task: Task): string {
    return `${task.type}-${task.priority}`;
  }

  private updateCache(task: Task, executionTime: number): void {
    const cacheKey = this.getCacheKey(task);
    const existingEntry = this.cache.get(cacheKey);

    const newEntry: CacheEntry = existingEntry 
      ? {
          successCount: existingEntry.successCount + 1,
          lastSuccessfulCost: executionTime,
          averageExecutionTime: this.calculateMovingAverage(
            existingEntry.averageExecutionTime, 
            executionTime, 
            existingEntry.successCount
          )
        }
      : {
          successCount: 1,
          lastSuccessfulCost: executionTime,
          averageExecutionTime: executionTime
        };

    this.cache.set(cacheKey, newEntry);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  private calculateMovingAverage(
    currentAverage: number, 
    newValue: number, 
    count: number
  ): number {
    return ((currentAverage * count) + newValue) / (count + 1);
  }

  private getCachedCostReduction(task: Task): number {
    const cacheKey = this.getCacheKey(task);
    const cacheEntry = this.cache.get(cacheKey);
    const cacheTimestamp = this.cacheTimestamps.get(cacheKey) || 0;

    if (
      cacheEntry && 
      (Date.now() - cacheTimestamp) < this.CACHE_DURATION_MS
    ) {
      const reductionFactor = Math.min(0.5, cacheEntry.successCount * 0.05);
      return task.cost * reductionFactor;
    }

    return 0;
  }

  private calculateMetrics(
    tasks: Task[], 
    results: string[], 
    assignments: Record<string, number[]>
  ): SchedulerMetrics {
    const completedTasks = results.filter(r => r.includes('completed')).length;
    const failedTasks = results.filter(r => r.includes('failed')).length;

    const workerUtilization: Record<string, number> = {};
    this.workers.forEach(worker => {
      workerUtilization[worker.id] = 
        (assignments[worker.id]?.length || 0) / worker.capacity * 100;
    });

    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      successRate: completedTasks / tasks.length * 100,
      avgExecutionTime: tasks.reduce((sum, task) => sum + task.cost, 0) / tasks.length,
      workerUtilization
    };
  }
}

export { 
  CacheEntry, 
  SchedulerMetrics, 
  SchedulerResult 
};