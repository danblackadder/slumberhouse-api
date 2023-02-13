import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
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

export interface GroupMessagesSchemaType {
  message: string;
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
}

export default mongoose.model<GroupMessagesSchemaType>('GroupMessages', schema);
