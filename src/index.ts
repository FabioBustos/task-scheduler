import { TaskSchedulerService } from './services/task-scheduler-service';
import { TaskModel, TaskPriority, TaskType } from './models/task.model';

const workers = [
  { id: 'worker1', capacity: 3 },
  { id: 'worker2', capacity: 3 },
  { id: 'worker3', capacity: 3 }
];

// const tasks = [
//   new TaskModel(1, 100, TaskPriority.LOW, TaskType.CPU),
//   new TaskModel(2, 30, TaskPriority.MEDIUM, TaskType.IO),
//   new TaskModel(3, 70, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(4, 50, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(5, 30, TaskPriority.MEDIUM, TaskType.IO),
//   new TaskModel(6, 70, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(7, 50, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(8, 30, TaskPriority.LOW, TaskType.IO),
//   new TaskModel(9, 70, TaskPriority.LOW, TaskType.CPU),
//   new TaskModel(10, 50, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(11, 30, TaskPriority.HIGH, TaskType.IO),
//   new TaskModel(12, 70, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(13, 50, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(14, 30, TaskPriority.MEDIUM, TaskType.IO),
//   new TaskModel(15, 70, TaskPriority.MEDIUM, TaskType.CPU),
//   new TaskModel(16, 50, TaskPriority.MEDIUM, TaskType.CPU),
//   new TaskModel(17, 30, TaskPriority.MEDIUM, TaskType.IO),
//   new TaskModel(18, 70, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(19, 70, TaskPriority.HIGH, TaskType.CPU),
//   new TaskModel(20, 70, TaskPriority.HIGH, TaskType.CPU)
// ];
const tasks = generateRandomTasks(20);

const scheduler = new TaskSchedulerService(workers);
scheduler.scheduleTasks(tasks)
  .then(result => console.log(result))
  .catch(error => console.error(error));


function generateRandomTasks(n: number): TaskModel[] {
    const tasks: TaskModel[] = [];
  
    for (let i = 1; i <= n; i++) {
      const priority = Object.values(TaskPriority)[Math.floor(Math.random() * 3)];
      const type = Object.values(TaskType)[Math.floor(Math.random() * 2)];
      const cost = Math.floor(Math.random() * 100) + 1; // Random cost between 1 and 100
  
      tasks.push(new TaskModel(i, cost, priority, type));
    }
  
    return tasks;
  }