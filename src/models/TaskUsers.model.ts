import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export interface TaskUserSchemaType {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

export default mongoose.model<TaskUserSchemaType>('TaskUser', schema);
