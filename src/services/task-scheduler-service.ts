import { Task, TaskModel, TaskPriority, TaskType } from '../models/task.model';
import { Worker, WorkerModel } from '../models/worker.model';
import { loggerService } from '../utils/logger';

interface CacheEntry {
  successCount: number;
  lastSuccessfulCost: number;
  averageExecutionTime: number;
}

interface SchedulerResult {
  assignments: Record<string, number[]>;
  results: string[];
}

export class TaskSchedulerService {
  private workers: WorkerModel[];
  private cache: Map<string, CacheEntry>;
  private MAX_RETRIES = 3;
  private CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache validity
  private cacheTimestamps: Map<string, number>;

  constructor(workers: Worker[]) {
    loggerService.info('Initializing TaskSchedulerService', { 
      workerCount: workers.length 
    });

    this.workers = workers.map(w => new WorkerModel(w.id, w.capacity));
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

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

    // Verificar si la caché está vigente
    if (
      cacheEntry && 
      (Date.now() - cacheTimestamp) < this.CACHE_DURATION_MS
    ) {
      // Reducir costo basado en éxitos previos
      const reductionFactor = Math.min(
        0.5, 
        cacheEntry.successCount * 0.05
      );
      
      return task.cost * reductionFactor;
    }

    return 0;
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

  async scheduleTasks(tasks: Task[]): Promise<SchedulerResult> {
   loggerService.info('Starting task scheduling', { 
      totalTasks: tasks.length 
    });

    const startTime = Date.now();
    const assignments: Record<string, number[]> = {};
    const results: string[] = [];

    // Registrar tareas entrantes
    tasks.forEach(task => 
      loggerService.debug('Incoming task', { 
        taskId: task.id, 
        priority: task.priority, 
        type: task.type 
      })
    );

    const prioritizedTasks = tasks.sort((a, b) => {
      const priorityOrder = { 
        [TaskPriority.HIGH]: 3, 
        [TaskPriority.MEDIUM]: 2, 
        [TaskPriority.LOW]: 1 
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const task of prioritizedTasks) {
      // Obtener reducción de costo por caché
      const cachedCostReduction = this.getCachedCostReduction(task);
      const adjustedTask = {
        ...task,
        cost: Math.max(task.cost - cachedCostReduction, task.cost * 0.2)
      };

      const worker = this.selectWorker(assignments);
      
      if (!worker) {
        const errorMsg = 'No available workers';
        loggerService.error(errorMsg, { 
          remainingTasks: tasks.length,
          currentAssignments: Object.keys(assignments).length
        });
        throw new Error(errorMsg);
      }

      // Trazar asignación de worker
      loggerService.traceWorkerAssignment(task, worker);

      assignments[worker.id] = assignments[worker.id] || [];
      assignments[worker.id].push(task.id);

      try {
        const { result, executionTime } = await this.executeTaskWithRetry(adjustedTask);
        
        // Actualizar caché con tiempo de ejecución
        this.updateCache(task, executionTime);
        
        // Trazar ejecución de tarea
        loggerService.traceTaskExecution(task, 'completed', { 
          executionTime,
          workerId: worker.id 
        });
        
        results.push(result);
      } catch (error) {
        loggerService.warn(`Task ${task.id} failed`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          workerId: worker.id
        });
        results.push(`Task ${task.id} failed`);
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    loggerService.info('Task scheduling completed', {
      totalTasks: tasks.length,
      completedTasks: results.length,
      totalExecutionTime,
      successRate: `${(results.filter(r => r.includes('completed')).length / tasks.length * 100).toFixed(2)}%`
    });

    return { assignments, results };
  }

  private selectWorker(assignments: Record<string, number[]>): Worker | null {
    const availableWorkers = this.workers.filter(worker => 
      (assignments[worker.id]?.length || 0) < worker.capacity
    );

    return availableWorkers.length > 0 
      ? availableWorkers[0] 
      : null;
  }

  private async executeTaskWithRetry(task: Task): Promise<{ result: string, executionTime: number }> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.executeTask(task);
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    throw new Error(`Task ${task.id} failed after ${this.MAX_RETRIES} attempts`);
  }
}

export { CacheEntry };