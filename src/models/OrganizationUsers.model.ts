import mongoose from 'mongoose';

import { OrganizationRole } from '../types/roles.types';
import { UserStatus } from '../types/user.types';

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
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
}

export default mongoose.model<OrganizationUsersSchemaType>('OrganizationUsers', schema);
