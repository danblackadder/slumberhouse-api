import mongoose from 'mongoose';
import fs from 'fs';
import { Server } from 'http';

import { Organization } from '../models';

const deleteTestFiles = async () => {
  const organization = await Organization.findOne({});
  const directory = `${__dirname}/../../uploads/${organization?._id.toString()}`;

  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

export const database = (databaseName: string, server: Server) => {
  beforeAll(async () => {
    const url = `mongodb://127.0.0.1/${databaseName}`;
    mongoose.set('strictQuery', false);
    await mongoose.connect(url);
  });

  beforeEach(async () => {
    await deleteTestFiles();
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await deleteTestFiles();
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });
};
