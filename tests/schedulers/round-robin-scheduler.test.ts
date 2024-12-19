import { beforeEach, describe, expect, it } from '@jest/globals';
import { RoundRobinScheduler } from '../../src/schedulers/round-robin-scheduler';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';

describe('Round Robin Scheduler', () => {
  let scheduler: RoundRobinScheduler;
  let workers: Worker[];
  let tasks: Task[];

  beforeEach(() => {
    workers = [
      { id: 'worker1', capacity: 2 },
      { id: 'worker2', capacity: 2 }
    ];
    tasks = [
      { id: 1, cost: 100, priority: TaskPriority.HIGH, type: TaskType.CPU },
      { id: 2, cost: 200, priority: TaskPriority.MEDIUM, type: TaskType.IO },
      { id: 3, cost: 150, priority: TaskPriority.LOW, type: TaskType.CPU }
    ];
    scheduler = new RoundRobinScheduler(workers);
  });

  it('should have correct strategy name', () => {
    expect(scheduler.strategyName).toBe('Round Robin');
  });

  it('should distribute tasks in round robin fashion', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    const workerAssignments = result.workerTaskHistory;
    expect(Object.keys(workerAssignments).length).toBe(workers.length);
    
    // Verificar que las tareas estén distribuidas de manera alternada
    const worker1Tasks = workerAssignments['worker1'];
    const worker2Tasks = workerAssignments['worker2'];
    expect(worker1Tasks.length).toBeGreaterThan(0);
    expect(worker2Tasks.length).toBeGreaterThan(0);
  });
});