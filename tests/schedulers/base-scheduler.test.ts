import { beforeEach, describe, expect, it } from '@jest/globals';
import { BaseTaskScheduler } from '../../src/schedulers/base-scheduler';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';

class TestScheduler extends BaseTaskScheduler {
  get strategyName(): string {
    return 'Test Scheduler';
  }

  protected selectWorker() {
    return this.workers[0] || null;
  }
}

describe('Base Scheduler', () => {
  let scheduler: TestScheduler;
  let workers: Worker[];
  let tasks: Task[];

  beforeEach(() => {
    workers = [
      { id: 'worker1', capacity: 2 },
      { id: 'worker2', capacity: 2 }
    ];
    tasks = [
      { id: 1, cost: 100, priority: TaskPriority.HIGH, type: TaskType.CPU },
      { id: 2, cost: 200, priority: TaskPriority.MEDIUM, type: TaskType.IO }
    ];
    scheduler = new TestScheduler(workers);
  });

  it('should initialize correctly', () => {
    expect(scheduler.strategyName).toBe('Test Scheduler');
  });

  it('should schedule tasks and return results', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    expect(result).toHaveProperty('assignments');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('workerTaskHistory');
    expect(result.strategyName).toBe('Test Scheduler');
  });

  it('should calculate metrics correctly', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    expect(result.metrics).toHaveProperty('totalTasks', tasks.length);
    expect(result.metrics).toHaveProperty('completedTasks');
    expect(result.metrics).toHaveProperty('failedTasks');
    expect(result.metrics).toHaveProperty('successRate');
    expect(result.metrics).toHaveProperty('avgExecutionTime');
    expect(result.metrics).toHaveProperty('workerUtilization');
  });
});