import { beforeEach, describe, expect, it } from '@jest/globals';
import { LeastLoadScheduler } from '../../src/schedulers/least-load-scheduler';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';

describe('Least Load Scheduler', () => {
  let scheduler: LeastLoadScheduler;
  let workers: Worker[];
  let tasks: Task[];

  beforeEach(() => {
    workers = [
      { id: 'worker1', capacity: 2 },
      { id: 'worker2', capacity: 3 }
    ];
    tasks = [
      { id: 1, cost: 100, priority: TaskPriority.HIGH, type: TaskType.CPU },
      { id: 2, cost: 200, priority: TaskPriority.MEDIUM, type: TaskType.IO },
      { id: 3, cost: 150, priority: TaskPriority.LOW, type: TaskType.CPU },
      { id: 4, cost: 150, priority: TaskPriority.LOW, type: TaskType.CPU },
    ];
    scheduler = new LeastLoadScheduler(workers);
  });

  it('should have correct strategy name', () => {
    expect(scheduler.strategyName).toBe('Least Load');
  });

  // it('should assign tasks to workers with least load', async () => {
  //   const result = await scheduler.scheduleTasks(tasks);
    
  //   const workerAssignments = result.workerTaskHistory;
  //   const worker1Tasks = workerAssignments['worker1'];
  //   const worker2Tasks = workerAssignments['worker2'];
    
  //   // El worker2 debería tener más tareas por tener mayor capacidad
  //   expect(worker2Tasks.length).toBeGreaterThanOrEqual(worker1Tasks.length);
  // });
});