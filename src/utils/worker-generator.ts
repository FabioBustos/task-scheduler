interface Worker {
  id: string;
  capacity: number;
}

export function createWorkers(numWorkers: number, capacity: number): Worker[] {
  const workers: Worker[] = [];
  for (let i = 1; i <= numWorkers; i++) {
    workers.push({ 'id': `worker${i}`, capacity });
  }
  return workers;
}