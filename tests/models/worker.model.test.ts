import { beforeEach, describe, expect, it } from '@jest/globals';
import { WorkerModel } from '../../src/models/worker.model';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';

describe('Worker Model', () => {
  let worker: WorkerModel;
  let mockTask: Task;

  beforeEach(() => {
    worker = new WorkerModel('worker1', 3);
    mockTask = {
      id: 1,
      cost: 100,
      priority: TaskPriority.HIGH,
      type: TaskType.CPU
    };
  });

  it('should create a worker with correct initial values', () => {
    expect(worker.id).toBe('worker1');
    expect(worker.capacity).toBe(3);
    expect(worker.currentTaskCount).toBe(0);
  });

  it('should add task correctly', () => {
    worker.addTask(mockTask);
    expect(worker.currentTaskCount).toBe(1);
    expect(worker.getAssignedTasks()).toContain(mockTask.id);
  });

  it('should remove task correctly', () => {
    worker.addTask(mockTask);
    worker.removeTask(mockTask.id);
    expect(worker.currentTaskCount).toBe(0);
    expect(worker.getAssignedTasks()).toContain(mockTask.id);
  });

  it('should not exceed capacity when adding tasks', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      ...mockTask,
      id: i + 1
    }));

    tasks.forEach(task => worker.addTask(task));
    expect(worker.currentTaskCount).toBe(worker.capacity);
  });
});
