import { IGroupTasksPostErrors, TaskStatus } from '../../types/task.types';

export const groupTaskPostValidation = async ({
  title,
  description,
  priority,
  due,
  status,
  users,
  tags,
}: {
  title: string;
  description: string;
  priority: number;
  due: Date;
  status: TaskStatus;
  users: string[];
  tags: string[];
}) => {
  const errors = {
    title: [],
    status: [],
  } as IGroupTasksPostErrors;

  if (!title) {
    errors.title.push('Title must be provided');
  }

  if (!status) {
    errors.status.push('Status must be provided');
  }

  return {
    errors,
    title,
    description,
    priority,
    due,
    status,
    users,
    tags,
  };
};
