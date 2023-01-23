import mongoose from 'mongoose';
import { OrganizationRole, UserStatus } from '../types';

const schema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      default: OrganizationRole.BASIC,
    },
    status: {
      type: String,
      required: true,
      default: UserStatus.INVITED,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
  },
  { timestamps: true }
);

export interface OrganizationUsersSchemaType {
  role: OrganizationRole;
  status: UserStatus;
  userId: mongoose.Schema.Types.ObjectId;
  organizationId: mongoose.Schema.Types.ObjectId;
}

export default mongoose.model<OrganizationUsersSchemaType>('OrganizationUsers', schema);
