import mongoose from 'mongoose';
import { TaskPriority, TaskStatus } from '../types/task.types';

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
    },
    due: {
      type: Date,
    },
  },
  { timestamps: true }
);

export interface TaskSchemaType {
  title: string;
  status: TaskStatus;
  description: string;
  priority: TaskPriority;
  due: Date;
}

export default mongoose.model<TaskSchemaType>('Task', schema);
