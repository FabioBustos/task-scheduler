import { generateRandomTasks } from '../../src/utils/task-generator';
import { TaskPriority, TaskType } from '../../src/models/task.model';
import { describe, expect, it } from '@jest/globals';

describe('Task Generator', () => {
  it('should generate the correct number of tasks', () => {
    const tasks = generateRandomTasks(5);
    expect(tasks.length).toBe(5);
  });

  it('should generate tasks with valid properties', () => {
    const tasks = generateRandomTasks(1);
    const task = tasks[0];

    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('cost');
    expect(task).toHaveProperty('priority');
    expect(task).toHaveProperty('type');
    expect(Object.values(TaskPriority)).toContain(task.priority);
    expect(Object.values(TaskType)).toContain(task.type);
  });

  it('should generate unique task IDs', () => {
    const tasks = generateRandomTasks(10);
    const ids = tasks.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(tasks.length);
  });
});