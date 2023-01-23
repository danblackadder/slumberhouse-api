import mongoose from 'mongoose';

import config from './config';

mongoose.set('strictQuery', false);
export default mongoose
  .connect(config.mongoUrl)
  .then(() => {
    console.log('Connected to MongoDb');
  })
  .catch((err: Error) => {
    throw `There is error in connecting Mongo DB ${err.message}`;
  });
