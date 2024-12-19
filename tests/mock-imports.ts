import { Task, TaskPriority, TaskType } from '../src/models/task.model';
import { Worker } from '../src/models/worker.model';

export const mockWorkers: Worker[] = [
    { id: 'worker1', capacity: 2 },
    { id: 'worker2', capacity: 3 },
    { id: 'worker3', capacity: 2 }
];

export const mockTasks: Task[] = [
    { 
        id: 1, 
        type: TaskType.CPU, 
        priority: TaskPriority.HIGH, 
        cost: 1000 
    },
    { 
        id: 2, 
        type: TaskType.IO, 
        priority: TaskPriority.MEDIUM, 
        cost: 500 
    },
    { 
        id: 3, 
        type: TaskType.IO, 
        priority: TaskPriority.LOW, 
        cost: 2000 
    }
];

export const mockWorkerTaskHistory = {
  'worker1': [1, 2],
  'worker2': [3],
  'worker3': []
};

export const mockSchedulerMetrics = [{
  metrics:{
    totalTasks: 3,
    completedTasks: 2,
    failedTasks: 1,
    failedTasksHistory: 1,
    avgExecutionTime: 1500,
    successRate: 66.67,
    workerUtilization: {
        'worker1': 50,
        'worker2': 33.33,
        'worker3': 50
    }
  },
  workerTaskHistory:mockWorkerTaskHistory
}];

