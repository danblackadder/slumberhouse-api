import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

export interface UserSchemaType {
  firstName: String;
  lastName: String;
  email: String;
  password: String;
}

export default mongoose.model<UserSchemaType>('User', schema);
