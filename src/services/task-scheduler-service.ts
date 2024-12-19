import { Task, TaskPriority, TaskType } from '../models/task.model';
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
    failedTasksHistory: number;
    avgExecutionTime: number;
    successRate: number;
    workerUtilization: Record<string, number>;
}

interface SchedulerResult {
    assignments: Record<string, number[]>;
    results: string[];
    metrics: SchedulerMetrics;
    workerTaskHistory: Record<string, number[]>;
}

export class TaskSchedulerService {
    private workers: WorkerModel[];
    private cache: Map<string, CacheEntry>;
    private cacheTimestamps: Map<string, number>;
    private taskQueue: Task[] = [];
    private completedTasks: Task[] = [];
    private failedTasks: Task[] = [];
    private failedTasksHistory: number = 0;
    private eventEmitter: EventEmitter;
    private workerTaskHistory: Record<string, number[]> = {};

    private readonly MAX_RETRIES = 3;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000;

    constructor(workers: Worker[]) {
        loggerService.info('Initializing TaskSchedulerService', { workerCount: workers.length });
        this.workers = workers.map(w => new WorkerModel(w.id, w.capacity));
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.eventEmitter = new EventEmitter();
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.eventEmitter.on('taskCompleted', (worker: WorkerModel, task: Task, executionTime: number) => {
            this.logTaskCompletion(worker, task, executionTime);
            this.removeTaskFromWorker(worker, task);
            this.updateCache(task, executionTime);
            this.completedTasks.push(task);
            this.checkAndAssignTasksGeneric();
        });

        this.eventEmitter.on('taskFailed', (worker: WorkerModel, task: Task) => {
            this.logTaskFailure(worker, task);
            this.removeTaskFromWorker(worker, task);
            this.failedTasks.push(task);
            this.requeueTask(task);
            this.checkAndAssignTasksGeneric();
        });
    }

    private logTaskStart(worker: WorkerModel, task: Task) {
        loggerService.info(`Worker ${worker.id} started task ${task.id}`, { taskType: task.type, taskPriority: task.priority });
    }

    private logTaskCompletion(worker: WorkerModel, task: Task, executionTime: number) {
        loggerService.info(`Worker ${worker.id} completed task ${task.id}`, { taskType: task.type, taskPriority: task.priority, executionTime });
    }

    private logTaskFailure(worker: WorkerModel, task: Task) {
        loggerService.warn(`Worker ${worker.id} failed task ${task.id}`, { taskType: task.type, taskPriority: task.priority });
    }

    private removeTaskFromWorker(worker: WorkerModel, task: Task) {
        worker.removeTask(task.id);
    }

    private requeueTask(task: Task) {
        this.taskQueue.push(task);
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
                    resolve({ result: `Task ${task.id} completed`, executionTime });
                }
            }, task.cost);
        });
    }

    private async executeTaskWithRetry(task: Task, worker: WorkerModel): Promise<{ result: string, executionTime: number }> {
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                this.logTaskStart(worker, task);
                const result = await this.executeTask(task);
                return result;
            } catch (error) {
                loggerService.warn(`Retry attempt ${attempt} for Task ${task.id}`, { workerId: worker.id, error: error instanceof Error ? error.message : 'Unknown error' });
                this.failedTasksHistory++;
                if (attempt === this.MAX_RETRIES) {
                    throw error;
                }
            }
        }
        throw new Error(`Task ${task.id} failed after ${this.MAX_RETRIES} attempts`);
    }

    private getCacheKey(task: Task): string {
        return `\{task\.type\}\-{task.priority}`;
    }

    private updateCache(task: Task, executionTime: number): void {
        const cacheKey = this.getCacheKey(task);
        const existingEntry = this.cache.get(cacheKey);

        const newEntry: CacheEntry = existingEntry
            ? {
                successCount: existingEntry.successCount + 1,
                lastSuccessfulCost: executionTime,
                averageExecutionTime: this.calculateMovingAverage(existingEntry.averageExecutionTime, executionTime, existingEntry.successCount)
            }
            : {
                successCount: 1,
                lastSuccessfulCost: executionTime,
                averageExecutionTime: executionTime
            };

        this.cache.set(cacheKey, newEntry);
        this.cacheTimestamps.set(cacheKey, Date.now());
    }

    private calculateMovingAverage(currentAverage: number, newValue: number, count: number): number {
        return ((currentAverage * count) + newValue) / (count + 1);
    }

    private getCachedCostReduction(task: Task): number {
        const cacheKey = this.getCacheKey(task);
        const cacheEntry = this.cache.get(cacheKey);
        const cacheTimestamp = this.cacheTimestamps.get(cacheKey) || 0;

        if (cacheEntry && (Date.now() - cacheTimestamp) < this.CACHE_DURATION_MS) {
            const reductionFactor = Math.min(0.5, cacheEntry.successCount * 0.05);
            return task.cost * reductionFactor;
        }

        return 0;
    }

    private selectWorkerLeastLoaded(assignments: Record<string, number[]>): WorkerModel | null {
        return this.workers.filter(worker => (assignments[worker.id]?.length || 0) < worker.capacity && worker.currentTaskCount < worker.capacity)
            .sort((a, b) => (assignments[a.id]?.length || 0) - (assignments[b.id]?.length || 0))[0] || null;
    }

    private selectWorkerRandomly(): WorkerModel | null {
        const availableWorkers = this.workers.filter(worker => worker.currentTaskCount < worker.capacity);
        if (availableWorkers.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * availableWorkers.length);
        return availableWorkers[randomIndex];
    }

    private selectWorkerByCapacity(assignments: Record<string, number[]>): WorkerModel | null {
        return this.workers.filter(worker => (assignments[worker.id]?.length || 0) < worker.capacity && worker.currentTaskCount < worker.capacity)
            .sort((a, b) => b.capacity - a.capacity)[0] || null;
    }

    private checkAndAssignTasks(selectWorkerFn: (assignments: Record<string, number[]>) => WorkerModel | null): Record<string, number[]> {
      const assignments: Record<string, number[]> = {};
      while (this.taskQueue.length > 0) {
          const worker = selectWorkerFn(assignments);
          if (!worker) break;

          const task = this.taskQueue.shift()!;
          const cachedCostReduction = this.getCachedCostReduction(task);
          const adjustedTask = { ...task, cost: Math.max(task.cost - cachedCostReduction, task.cost * 0.2) };

          worker.addTask(adjustedTask);
          assignments[worker.id] = assignments[worker.id] || [];
          assignments[worker.id].push(task.id);

          this.workerTaskHistory[worker.id] = this.workerTaskHistory[worker.id] || [];
          this.workerTaskHistory[worker.id].push(task.id);

          this.executeTaskWithRetry(adjustedTask, worker)
              .then(({ result, executionTime }) => this.eventEmitter.emit('taskCompleted', worker, task, executionTime))
              .catch(() => this.eventEmitter.emit('taskFailed', worker, task));
      }
      return assignments;
  }

  private checkAndAssignTasksGeneric(): Record<string, number[]> {
      return this.checkAndAssignTasks(this.selectWorkerLeastLoaded.bind(this));
  }

  async scheduleTasks(tasks: Task[]): Promise<Record<string, Record<string, SchedulerResult>>> {
      const schedulingStrategies: { [name: string]: (tasks: Task[]) => Task[] } = {
          'Priority Scheduling': (tasks: Task[]) => tasks.sort((a, b) => {
              const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
          }),
          'First Come First Served': (tasks: Task[]) => tasks,
          'Shortest Job First': (tasks: Task[]) => tasks.sort((a, b) => a.cost - b.cost)
      };

      const assignmentStrategies = {
          'Least Loaded': this.selectWorkerLeastLoaded.bind(this),
          'Random Assignment': this.selectWorkerRandomly.bind(this),
          'By Capacity': this.selectWorkerByCapacity.bind(this),
      };

      const allResults: Record<keyof typeof schedulingStrategies, Record<keyof typeof assignmentStrategies, Promise<SchedulerResult>>> = {};

      for (const strategyName in schedulingStrategies) {
        allResults[strategyName] = {} as Record<keyof typeof assignmentStrategies, Promise<SchedulerResult>>;
        for (const assignmentStrategyName of Object.keys(assignmentStrategies) as (keyof typeof assignmentStrategies)[]) { // Cast en el bucle
            const strategyStartTime = Date.now();
            this.completedTasks = [];
            this.failedTasks = [];
            this.failedTasksHistory = 0;
            this.workerTaskHistory = {};
            for (const worker of this.workers) {
                this.workerTaskHistory[worker.id] = [];
            }

            this.taskQueue = [...schedulingStrategies[strategyName as keyof typeof schedulingStrategies](tasks)];
            const assignments = this.checkAndAssignTasks(assignmentStrategies[assignmentStrategyName]);

            allResults[strategyName][assignmentStrategyName] = new Promise<SchedulerResult>((resolve) => {
                const checkCompletion = () => {
                    if (this.taskQueue.length === 0 && this.workers.every(worker => worker.currentTaskCount === 0)) {
                        const metrics = this.calculateMetrics(tasks, this.completedTasks.map(() => 'completed'), assignments);
                        const strategyExecutionTime = Date.now() - strategyStartTime;
                        loggerService.info(`Task scheduling completed for ${strategyName} with assignment strategy ${assignmentStrategyName}`, { ...metrics, totalExecutionTime: strategyExecutionTime });
                        resolve({ assignments, results: this.completedTasks.map(task => `Task ${task.id} completed`), metrics, workerTaskHistory: this.workerTaskHistory });
                    } else {
                        setTimeout(checkCompletion, 100);
                    }
                };
                checkCompletion();
            });
          }
      }

       const finalResult: Record<string, Record<string, SchedulerResult>> = {};
        return Promise.all(
            Object.entries(allResults).map(async ([strategyName, assignmentResults]) => {
                finalResult[strategyName] = {};
                const resolvedAssignmentResults = await Promise.all(Object.values(assignmentResults));
                let index = 0
                for(const assignmentStrategyName of Object.keys(assignmentStrategies)){
                    finalResult[strategyName][assignmentStrategyName] = resolvedAssignmentResults[index]
                    index++
                }
                return finalResult
            })
        ).then(() => finalResult);
  }

  private calculateMetrics(tasks: Task[], results: string[], assignments: Record<string, number[]>): SchedulerMetrics {
      const completedTasks = results.filter(r => r.includes('completed')).length;
      const failedTasks = results.filter(r => r.includes('failed')).length;

      const workerUtilization: Record<string, number> = {};
      this.workers.forEach(worker => {
          workerUtilization[worker.id] = (assignments[worker.id]?.length || 0) / worker.capacity * 100;
      });

      let totalExecutionTime = 0;

      for (const worker in this.workerTaskHistory) {
          this.workerTaskHistory[worker].forEach((taskId) => {
              const task = tasks.find(task => task.id == taskId);
              if (task) {
                  totalExecutionTime += task.cost;
              }
          });
      }

      return {
          totalTasks: tasks.length,
          completedTasks,
          failedTasks,
          failedTasksHistory: this.failedTasksHistory,
          successRate: completedTasks / tasks.length * 100,
          avgExecutionTime: totalExecutionTime / tasks.length,
          workerUtilization
      };
  }
}

export { CacheEntry, SchedulerMetrics, SchedulerResult };