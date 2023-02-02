import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Task',
    },
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tag',
    },
  },
  { timestamps: true }
);

export interface TaskTagsSchemaType {
  taskId: mongoose.Types.ObjectId;
  tagId: mongoose.Types.ObjectId;
}

export default mongoose.model<TaskTagsSchemaType>('TaskTag', schema);
