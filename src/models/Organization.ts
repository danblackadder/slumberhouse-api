import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export interface OrganizationSchemaType {
  name: String;
}

export default mongoose.model<OrganizationSchemaType>('Organization', schema);
