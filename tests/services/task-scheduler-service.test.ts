// // Mock the logger service
jest.mock('../../src/utils/logger', () => ({
  loggerService: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
  }
}));

import { TaskSchedulerService } from '../../src/services/task-scheduler-service';
import { Task, TaskPriority, TaskType } from '../../src/models/task.model';
import { Worker } from '../../src/models/worker.model';
import { loggerService } from '../../src/utils/logger';

describe('TaskSchedulerService', () => {
  let scheduler: TaskSchedulerService;
  let workers: Worker[];
  let tasks: Task[];

  beforeEach(() => {
      workers = [
          { id: 'worker1', capacity: 2 },
          { id: 'worker2', capacity: 3 },
          { id: 'worker3', capacity: 2 }
      ];

      tasks = [
          { 
              id: 1, 
              type: TaskType.CPU, 
              priority: TaskPriority.HIGH, 
              cost: 100
          },
          { 
              id: 2, 
              type: TaskType.IO, 
              priority: TaskPriority.MEDIUM, 
              cost: 50
          },
          { 
              id: 3, 
              type: TaskType.CPU, 
              priority: TaskPriority.LOW, 
              cost: 20
          }
      ];

      scheduler = new TaskSchedulerService(workers);
      
      jest.clearAllMocks();
  });

  describe('Task Scheduling', () => {
      it('should schedule tasks successfully', async () => {
          const result = await scheduler.scheduleTasks(tasks);
          
          expect(result).toBeDefined();
          expect(Object.keys(result)).toContain('Priority Scheduling');
          expect(Object.keys(result)).toContain('First Come First Served');
          expect(Object.keys(result)).toContain('Shortest Job First');
      });

      it('should apply different scheduling strategies correctly', async () => {
          const result = await scheduler.scheduleTasks(tasks);

          const priorityScheduling = result['Priority Scheduling']['Least Loaded'];
          expect(priorityScheduling.assignments).toBeDefined();
          expect(Object.values(priorityScheduling.assignments).flat()).toContain(1); 

          
          const shortestJobFirst = result['Shortest Job First']['Least Loaded'];
          expect(shortestJobFirst.assignments).toBeDefined();
      });

      it('should calculate metrics correctly', async () => {
          const result = await scheduler.scheduleTasks(tasks);
          
          Object.values(result).forEach(strategyResults => {
              Object.values(strategyResults).forEach(strategyResult => {
                  const metrics = strategyResult.metrics;
                  expect(metrics.totalTasks).toBe(tasks.length);
                  expect(metrics.workerUtilization).toBeDefined();
                  expect(Object.keys(metrics.workerUtilization)).toHaveLength(workers.length);
              });
          });
      });
  });

  describe('Worker Assignment', () => {
      it('should respect worker capacity limits', async () => {
          const result = await scheduler.scheduleTasks(tasks);
          
          Object.values(result).forEach(strategyResults => {
              Object.values(strategyResults).forEach(strategyResult => {
                  Object.entries(strategyResult.assignments).forEach(([workerId, assignedTasks]) => {
                      const worker = workers.find(w => w.id === workerId);
                      expect(assignedTasks.length).toBeLessThanOrEqual(worker!.capacity);
                  });
              });
          });
      });
  });

  describe('Cache Behavior', () => {
      it('should apply cost reduction for previously successful task types', async () => {
          await scheduler.scheduleTasks([tasks[0]]);
          
          const secondResult = await scheduler.scheduleTasks([{...tasks[0], id: 4}]);
          
          const firstMetrics = (await scheduler.scheduleTasks([tasks[0]]))['Priority Scheduling']['Least Loaded'].metrics;
          const secondMetrics = secondResult['Priority Scheduling']['Least Loaded'].metrics;
          
          expect(secondMetrics.avgExecutionTime).toBeLessThanOrEqual(firstMetrics.avgExecutionTime);
      });
  });

  describe('Edge Cases', () => {
      it('should handle empty task list', async () => {
          const result = await scheduler.scheduleTasks([]);
          
          Object.values(result).forEach(strategyResults => {
              Object.values(strategyResults).forEach(strategyResult => {
                  expect(strategyResult.metrics.totalTasks).toBe(0);
                  expect(strategyResult.assignments).toEqual({});
              });
          });
      });

      it('should handle single worker scenario', async () => {
          scheduler = new TaskSchedulerService([workers[0]]);
          const result = await scheduler.scheduleTasks(tasks);
          
          Object.values(result).forEach(strategyResults => {
              Object.values(strategyResults).forEach(strategyResult => {
                  expect(Object.keys(strategyResult.workerTaskHistory)).toHaveLength(1);
              });
          });
      });

      it('should handle tasks exceeding total worker capacity', async () => {
          const manyTasks = Array(10).fill(null).map((_, index) => ({
              ...tasks[0],
              id: index + 1
          }));
          
          const result = await scheduler.scheduleTasks(manyTasks);
          
          Object.values(result).forEach(strategyResults => {
              Object.values(strategyResults).forEach(strategyResult => {
                  const totalAssignedTasks = Object.values(strategyResult.assignments)
                      .reduce((sum, tasks) => sum + tasks.length, 0);
                  const totalCapacity = workers.reduce((sum, worker) => sum + worker.capacity, 0);
                  expect(totalAssignedTasks).toBeLessThanOrEqual(totalCapacity);
              });
          });
      });
  });
});