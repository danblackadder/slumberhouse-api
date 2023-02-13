import { Response } from 'express';
import mongoose from 'mongoose';

export interface IClient {
  id: number;
  groupId: mongoose.Types.ObjectId;
  response: Response;
}
