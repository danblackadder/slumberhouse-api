import 'dotenv/config';
import request from 'supertest';
import bcrypt from 'bcryptjs';

import server from '../server';
import { database, createUser } from './config';
import { OrganizationUsers, User } from '../models';
import { OrganizationRole, UserStatus } from '../types';

describe('/users', () => {
  database('slumberhouse-test', server);

  describe.only('GET /', () => {
    it('returns users associated with a company', async () => {
      const { token, id } = await createUser();

      const hashedPassword = await bcrypt.hash('fr5T$kE@LNy8p8a', 10);
      const user = await User.create({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test2@test.com',
        password: hashedPassword,
      });

      const organization = await OrganizationUsers.findOne({ userId: id });

      await OrganizationUsers.create({
        role: OrganizationRole.ADMIN,
        status: UserStatus.INVITED,
        userId: user._id,
        organizationId: organization?.organizationId,
      });

      const response = await request(server).get('/users/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body[0].role).toBe('owner');
      expect(response.body[0].status).toBe('active');
      expect(response.body[1].role).toBe('admin');
      expect(response.body[1].status).toBe('invited');
    });
  });

  describe('POST /', () => {
    it('successfully invites a new user', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/users/')
        .send({ email: 'new@email.com' })
        .set('Authorization', `Bearer ${token}`);

      const user = await User.findOne({ email: 'new@email.com' });
      const organizationUser = await OrganizationUsers.findOne({ userId: user?._id });

      expect(response.status).toBe(200);
      expect(user).toBeDefined();
      expect(organizationUser?.userId.toString()).toBe(user?._id.toString());
      expect(organizationUser?.role).toBe('basic');
      expect(organizationUser?.status).toBe('invited');
    });

    it('fails if email is not passed', async () => {
      const { token } = await createUser();
      const response = await request(server).post('/users/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be supplied');
    });

    it('fails if email is not a valid email', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/users/')
        .send({ email: 's@s' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be a valid email address');
    });

    it('fails if email is not unique', async () => {
      await User.create({
        email: 'new@email.com',
      });

      const { token } = await createUser();
      const response = await request(server)
        .post('/users/')
        .send({ email: 'new@email.com' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email address is already in use');
    });
  });
});
