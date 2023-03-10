import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Group',
    },
  },
  { timestamps: true }
);

export interface OrganizationGroupsSchemaType {
  organizationId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
}

export default mongoose.model<OrganizationGroupsSchemaType>('OrganizationGroups', schema);
