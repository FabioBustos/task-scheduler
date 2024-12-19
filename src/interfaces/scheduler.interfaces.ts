import { Task } from '../models/task.model';

export interface SchedulerMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  failedTasksHistory: number;
  avgExecutionTime: number;
  successRate: number;
  workerUtilization: Record<string, number>;
  strategyName: string;
  executionTimeMs: number;
}

export interface SchedulerResult {
  assignments: Record<string, number[]>;
  results: string[];
  metrics: SchedulerMetrics;
  workerTaskHistory: Record<string, number[]>;
  strategyName: string;
}

