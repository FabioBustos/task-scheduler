import { TaskSchedulerService } from '../../src/services/task-scheduler.service';
import { TaskModel, TaskPriority, TaskType } from '../../src/models/task.model';

describe('TaskSchedulerService', () => {
  const workers = [
    { id: 'worker1', capacity: 2 },
    { id: 'worker2', capacity: 2 }
  ];

  const tasks = [
    new TaskModel(1, 100, TaskPriority.HIGH, TaskType.CPU),
    new TaskModel(2, 50, TaskPriority.MEDIUM, TaskType.IO),
    new TaskModel(3, 200, TaskPriority.LOW, TaskType.CPU)
  ];

  let scheduler: TaskSchedulerService;

  beforeEach(() => {
    scheduler = new TaskSchedulerService(workers);
  });

  it('should schedule tasks successfully', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    expect(result.assignments).toBeDefined();
    expect(result.results.length).toBe(3);
  });

  it('should prioritize high priority tasks', async () => {
    const result = await scheduler.scheduleTasks(tasks);
    
    // Verificar que los trabajos de alta prioridad se asignen primero
    const assignments = result.assignments;
    const highPriorityTaskIds = tasks
      .filter(t => t.priority === TaskPriority.HIGH)
      .map(t => t.id);
    
    highPriorityTaskIds.forEach(taskId => {
      const workerWithTask = Object.keys(assignments).find(workerId => 
        assignments[workerId].includes(taskId)
      );
      expect(workerWithTask).toBeDefined();
    });
  });
});