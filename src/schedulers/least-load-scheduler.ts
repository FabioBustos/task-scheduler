import { BaseTaskScheduler } from './base-scheduler';
import { WorkerModel } from '../models/worker.model';

export class LeastLoadScheduler extends BaseTaskScheduler {
  get strategyName(): string {
    return "Least Load";
  }

  protected selectWorker(assignments: Record<string, number[]>): WorkerModel | null {
    return this.workers
      .filter(worker => worker.currentTaskCount < worker.capacity)
      .sort((a, b) => a.currentTaskCount - b.currentTaskCount)[0] || null;
  }
}