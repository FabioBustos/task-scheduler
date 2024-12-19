import { SchedulerComparator } from './services/scheduler-comparator';
import { generateRandomTasks } from './utils/task-generator';
import { createWorkers } from './utils/worker-generator';
 
const workers = createWorkers(100,3)
 
const comparator = new SchedulerComparator(workers);
const tasks = generateRandomTasks(1000);
 
comparator.compareStrategies(tasks)
  .then(results => {
    results.forEach(result => {
      console.log(`\nStrategy: ${result.strategyName}`);
      console.log('Metrics:', result.metrics);
      console.log('Worker Task History:');
      Object.entries(result.workerTaskHistory).forEach(([workerId, tasks]) => {
        console.log(`${workerId}: Executed ${tasks.length} tasks`);
        console.log(`Tasks: [${tasks.join(', ')}]`);
      });
    });
  })
  .catch(console.error);