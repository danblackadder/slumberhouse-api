export enum TaskStatus {
  DRAFT = 'draft',
  TO_DO = 'to do',
  IN_PROGRESS = 'in progress',
  IN_REVIEW = 'in review',
  COMPLETED = 'completed',
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface IGroupTasksPostErrors {
  title: string[];
  status: string[];
}

export interface ITaskUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}
export interface ITask {
  title: string;
  status: TaskStatus;
  tags: string[];
  users: ITaskUser[];
  description?: string;
  priority?: TaskPriority;
  due?: Date;
}

export interface IEventSourceTask {
  body: ITask[];
  error?: unknown;
}
