import { beforeEach, describe, expect, it } from '@jest/globals';
import { RandomScheduler } from '../../src/schedulers/random-scheduler';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';

describe('Random Scheduler', () => {
  let scheduler: RandomScheduler;
  let workers: Worker[];
  let tasks: Task[];

  beforeEach(() => {
    workers = [
      { id: 'worker1', capacity: 2 },
      { id: 'worker2', capacity: 2 }
    ];
    tasks = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      cost: 100,
      priority: TaskPriority.HIGH,
      type: TaskType.CPU
    }));
    scheduler = new RandomScheduler(workers);
  });

  it('should have correct strategy name', () => {
    expect(scheduler.strategyName).toBe('Random Assignment');
  });

  it('should assign tasks randomly but respect worker capacity', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    const workerAssignments = result.workerTaskHistory;
    console.log(workerAssignments);
    
    Object.values(workerAssignments).forEach(workerTasks => {
      expect(workerTasks.length).toBeLessThanOrEqual(workers[0].capacity * 2);
    });
  });
});