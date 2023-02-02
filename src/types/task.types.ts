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
