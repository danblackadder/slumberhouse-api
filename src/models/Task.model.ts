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
    titleLockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    descriptionLockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
  titleLockedUserId: mongoose.Types.ObjectId;
  descriptionLockedUserId: mongoose.Types.ObjectId;
  createdByUserId: mongoose.Types.ObjectId;
  updatedByUserId: mongoose.Types.ObjectId;
}

export default mongoose.model<TaskSchemaType>('Task', schema);
