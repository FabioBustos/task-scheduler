import { BaseTaskScheduler } from './base-scheduler';
import { WorkerModel } from '../models/worker.model';

export class RoundRobinScheduler extends BaseTaskScheduler {
  private currentWorkerIndex = 0;

  get strategyName(): string {
    return "Round Robin";
  }

  protected selectWorker(assignments: Record<string, number[]>): WorkerModel | null {
    const availableWorkers = this.workers.filter(w => w.currentTaskCount < w.capacity);
    if (availableWorkers.length === 0) return null;

    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return this.workers[this.currentWorkerIndex];
  }
}