import mongoose from 'mongoose';

import { GroupRole } from '../types/roles.types';

const schema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      default: GroupRole.BASIC,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Group',
    },
  },
  { timestamps: true }
);

export interface GroupUsersSchemaType {
  role: GroupRole;
  userId: mongoose.Schema.Types.ObjectId;
  groupId: mongoose.Schema.Types.ObjectId;
}

export default mongoose.model<GroupUsersSchemaType>('GroupUsers', schema);
