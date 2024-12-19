import { BaseTaskScheduler } from './base-scheduler';
import { WorkerModel } from '../models/worker.model';

export class RandomScheduler extends BaseTaskScheduler {
  get strategyName(): string {
    return "Random Assignment";
  }

  protected selectWorker(assignments: Record<string, number[]>): WorkerModel | null {
    const availableWorkers = this.workers.filter(w => w.currentTaskCount < w.capacity);
    if (availableWorkers.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableWorkers.length);
    return availableWorkers[randomIndex];
  }
}