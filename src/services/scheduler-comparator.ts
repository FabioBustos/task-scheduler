import { Task } from '../models/task.model';
import { Worker } from '../models/worker.model';
import { SchedulerResult } from '../interfaces/scheduler.interfaces';
import { RoundRobinScheduler } from '../schedulers/round-robin-scheduler';
import { LeastLoadScheduler } from '../schedulers/least-load-scheduler';
import { RandomScheduler } from '../schedulers/random-scheduler';
import { BaseTaskScheduler } from '../schedulers/base-scheduler';

export class SchedulerComparator {
  private strategies: BaseTaskScheduler[];

  constructor(workers: Worker[]) {
    this.strategies = [
      new RoundRobinScheduler(workers),
      new LeastLoadScheduler(workers),
      new RandomScheduler(workers)
    ];
  }

  async compareStrategies(tasks: Task[]): Promise<SchedulerResult[]> {
    const results: SchedulerResult[] = [];

    for (const scheduler of this.strategies) {
      const result = await scheduler.scheduleTasks([...tasks]);
      results.push(result);
    }

    return results;
  }
}