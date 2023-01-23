import 'dotenv/config';
import request from 'supertest';
import bcrypt from 'bcryptjs';

import server from '../server';
import { database, createUser } from './config';
import { Group, GroupUsers, Organization, OrganizationGroup, OrganizationUsers, User } from '../models';
import { GroupRole, OrganizationRole } from '../types';
import path from 'path';

describe('/group', () => {
  database('slumberhouse-test', server);

  describe('POST /', () => {
    it('successfully creates a new group with a name', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({
          name: 'Slumberhouse',
        })
        .set('Authorization', `Bearer ${token}`);

      const group = await Group.findOne({ name: 'Slumberhouse' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
      expect(group).toBeDefined();
    });

    it('successfully creates a new group with a description', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({
          name: 'Slumberhouse',
          description: 'The best group ever',
        })
        .set('Authorization', `Bearer ${token}`);

      const group = await Group.findOne({ name: 'Slumberhouse' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
      expect(group).toBeDefined();
      expect(group?.description).toBe('The best group ever');
    });

    it('successfully creates a new group with an image', async () => {
      const image = path.resolve(__dirname, `./assets/logo.png`);

      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .set('content-type', 'application/octet-stream')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Slumberhouse')
        .attach('image', image);

      const group = await Group.findOne({ name: 'Slumberhouse' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
      expect(group).not.toBe(null);
      expect(group?.image).not.toBe(null);
    });

    it.only('successfully updates the organization with the new group', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({ name: 'Slumberhouse' })
        .set('Authorization', `Bearer ${token}`);

      const group = await Group.findOne({ name: 'Slumberhouse' });
      const organizationGroup = await OrganizationGroup.findOne({ groupId: group?._id });

      console.log(organizationGroup);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(organizationGroup).not.toBe(null);
    });

    it('updates a user admin role upon successfully creating a group', async () => {
      const { token, id } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({
          name: 'Slumberhouse',
        })
        .set('Authorization', `Bearer ${token}`);

      const group = await Group.findOne({ name: 'Slumberhouse' });
      const groupUser = await GroupUsers.findOne({ userId: id });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
      expect(groupUser?.userId.toString()).toBe(id.toString());
      expect(groupUser?.groupId.toString()).toBe(group?.id.toString());
      expect(groupUser?.role).toBe(GroupRole.ADMIN);
    });

    it('returns group name upon successfully creating a new group', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({
          name: 'Slumberhouse',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBeUndefined();
    });

    it('fails if no authentication token is passed', async () => {
      const response = await request(server).post('/group/').send({
        name: 'Slumberhouse',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });

    it('fails if no name is passed', async () => {
      const { token } = await createUser();
      const response = await request(server).post('/group/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.name).toContain('Name must be supplied');
    });

    it('fails if name is less than 2 characters long', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .post('/group/')
        .send({ name: 's' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.name).toContain('Name must be longer than 2 characters');
    });
  });

  describe('GET /', () => {
    it('returns groups associated with user id', async () => {
      const { id, token } = await createUser();

      const group1 = await Group.create({
        name: 'Slumberhouse',
      });

      const group2 = await Group.create({
        name: 'Test',
      });

      await GroupUsers.create({
        userId: id,
        role: GroupRole.ADMIN,
        groupId: group1._id,
      });

      await GroupUsers.create({
        userId: id,
        role: GroupRole.ADMIN,
        groupId: group2._id,
      });

      const response = await request(server).get('/group/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body[0].name).toBe('Slumberhouse');
      expect(response.body[1].name).toBe('Test');
    });

    it('returns a count of users associated with group', async () => {
      const { id, token } = await createUser();

      const hashedPassword = await bcrypt.hash('fr5T$kE@LNy8p8a', 10);
      const user = await User.create({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test2@test.com',
        password: hashedPassword,
      });

      const group = await Group.create({
        name: 'Slumberhouse',
      });

      await GroupUsers.create({
        userId: id,
        role: GroupRole.ADMIN,
        groupId: group._id,
      });

      await GroupUsers.create({
        userId: user._id,
        role: GroupRole.ADMIN,
        groupId: group._id,
      });

      const response = await request(server).get('/group/').set('Authorization', `Bearer ${token}`);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body[0].count).toBe(2);
    });
  });
});
