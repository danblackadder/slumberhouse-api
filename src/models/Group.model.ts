import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

export interface GroupSchemaType {
  name: String;
  description?: String;
  image?: String;
}

export default mongoose.model<GroupSchemaType>('Group', schema);
