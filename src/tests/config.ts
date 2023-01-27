import mongoose from 'mongoose';

import { Server } from 'http';

export const database = (databaseName: string, server: Server) => {
  beforeAll(async () => {
    const url = `mongodb://127.0.0.1/${databaseName}`;
    mongoose.set('strictQuery', false);
    await mongoose.connect(url);
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });
};
