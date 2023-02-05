import mongoose from 'mongoose';

import { GroupRole } from '../types/roles.types';

const schema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Group',
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
  },
  { timestamps: true }
);

export interface GroupTasksSchemaType {
  role: GroupRole;
  groupId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
}

export default mongoose.model<GroupTasksSchemaType>('GroupTasks', schema);
