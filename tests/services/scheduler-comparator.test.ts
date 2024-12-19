import { beforeEach, describe, expect, it } from '@jest/globals';
import { SchedulerComparator } from '../../src/services/scheduler-comparator';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';

describe('Scheduler Comparator', () => {
  let comparator: SchedulerComparator;
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
    comparator = new SchedulerComparator(workers);
  });

  it('should compare different scheduling strategies', async () => {
    const results = await comparator.compareStrategies(tasks);
    
    expect(results.length).toBe(3); // Round Robin, Least Load, Random
    expect(results.map(r => r.strategyName)).toContain('Round Robin');
    expect(results.map(r => r.strategyName)).toContain('Least Load');
    expect(results.map(r => r.strategyName)).toContain('Random Assignment');
  });

  it('should provide metrics for each strategy', async () => {
    const results = await comparator.compareStrategies(tasks);
    
    results.forEach(result => {
      expect(result.metrics).toHaveProperty('totalTasks');
      expect(result.metrics).toHaveProperty('completedTasks');
      expect(result.metrics).toHaveProperty('failedTasks');
      expect(result.metrics).toHaveProperty('successRate');
    });
  });
});