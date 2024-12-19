import { describe, expect, it } from '@jest/globals';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';

describe('Task Model', () => {
  it('should create a task with valid properties', () => {
    const task: Task = {
      id: 1,
      cost: 100,
      priority: TaskPriority.HIGH,
      type: TaskType.CPU
    };

    expect(task.id).toBe(1);
    expect(task.cost).toBe(100);
    expect(task.priority).toBe(TaskPriority.HIGH);
    expect(task.type).toBe(TaskType.CPU);
  });

  it('should have valid enum values for TaskPriority', () => {
    expect(Object.values(TaskPriority)).toContain('low');
    expect(Object.values(TaskPriority)).toContain('medium');
    expect(Object.values(TaskPriority)).toContain('high');
  });

  it('should have valid enum values for TaskType', () => {
    expect(Object.values(TaskType)).toContain('CPU');
    expect(Object.values(TaskType)).toContain('IO');
  });
});

