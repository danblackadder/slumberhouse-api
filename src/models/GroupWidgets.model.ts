import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Group',
    },
    widgetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Widget',
    },
  },
  { timestamps: true }
);

export interface GroupWidgetsSchemaType {
  groupId: mongoose.Types.ObjectId;
  widgetId: mongoose.Types.ObjectId;
}

export default mongoose.model<GroupWidgetsSchemaType>('GroupWidgets', schema);
