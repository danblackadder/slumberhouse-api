import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    widget: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export interface WidgetSchemaType {
  widget: string;
}

export default mongoose.model<WidgetSchemaType>('Widgets', schema);
