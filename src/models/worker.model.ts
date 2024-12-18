export interface Worker {
  id: string;
  capacity: number;
}

export class WorkerModel implements Worker {
  constructor(
    public id: string, 
    public capacity: number
  ) {}

  validate(): boolean {
    return this.capacity > 0;
  }
}