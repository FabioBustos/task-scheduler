import { describe, expect, it } from '@jest/globals';
import { createWorkers } from '../../src/utils/worker-generator';

describe('Worker Generator', () => {
  it('should create the correct number of workers', () => {
    const workers = createWorkers(5, 2);
    expect(workers.length).toBe(5);
  });

  it('should create workers with correct properties', () => {
    const capacity = 3;
    const workers = createWorkers(1, capacity);
    const worker = workers[0];

    expect(worker).toHaveProperty('id');
    expect(worker).toHaveProperty('capacity');
    expect(worker.capacity).toBe(capacity);
    expect(worker.id).toMatch(/worker\d+/);
  });

  it('should create workers with unique IDs', () => {
    const workers = createWorkers(10, 2);
    const ids = workers.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(workers.length);
  });
});