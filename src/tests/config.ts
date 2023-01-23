import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

import { Organization, OrganizationUsers, User } from '../models';
import { OrganizationRole, UserStatus } from '../types';

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

export const createUser = async () => {
  const hashedPassword = await bcrypt.hash('fr5T$kE@LNy8p8a', 10);

  const user = await User.create({
    firstName: 'FirstTest',
    lastName: 'LastTest',
    email: 'test@test.com',
    password: hashedPassword,
  });

  const organization = await Organization.create({ name: 'Slumberhouse' });

  await OrganizationUsers.create({
    role: OrganizationRole.OWNER,
    status: UserStatus.ACTIVE,
    userId: user._id,
    organizationId: organization._id,
  });

  return {
    id: user._id,
    token: jwt.sign({ id: user._id }, process.env.JWT_SECRET as string),
  };
};
