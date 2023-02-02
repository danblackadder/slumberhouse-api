import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Group',
    },
  },
  { timestamps: true }
);

export interface GroupTagSchemaType {
  tag: string;
  groupId: mongoose.Types.ObjectId;
}

export default mongoose.model<GroupTagSchemaType>('GroupTag', schema);
