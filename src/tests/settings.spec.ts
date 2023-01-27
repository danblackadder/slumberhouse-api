import 'dotenv/config';

import { Group, GroupUsers, OrganizationUsers, User } from '../models';
import server from '../server';
import { GroupRole, OrganizationRole } from '../types/roles.types';
import { createGroups, createOrganization, createUser, createUsers } from '../utility/mock';

import { database } from './config';

import { faker } from '@faker-js/faker';
import path from 'path';
import request from 'supertest';

describe('/settings', () => {
  database('slumberhouse-test', server);

  describe('/users', () => {
    describe('GET /', () => {
      it('returns users associated with a company if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        await createUsers({ organizationId, count: 2 });

        const response = await request(server)
          .get('/settings/users/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.users).toHaveLength(3);
      });

      it('returns users associated with a company if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        await createUsers({ organizationId, count: 2 });

        const response = await request(server)
          .get('/settings/users/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.users).toHaveLength(3);
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .get('/settings/users/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
        expect(response.body.users).toBeUndefined();
      });

      it('returns paginated users', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        await createUsers({ organizationId, count: 50 });

        const response = await request(server)
          .get('/settings/users/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(20);
        expect(response.body.pagination.totalDocuments).toBe(51);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalPages).toBe(3);
      });
    });

    describe('POST /', () => {
      it('successfully invites a new user if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const email = faker.internet.email();

        const response = await request(server)
          .post('/settings/users/')
          .send({ email })
          .set('Authorization', `Bearer ${token}`);

        const user = await User.findOne({ email });
        const organizationUser = await OrganizationUsers.findOne({ userId: user?._id });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser?.role).toBe('basic');
        expect(organizationUser?.status).toBe('invited');
      });

      it('successfully invites a new user if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        const email = faker.internet.email();

        const response = await request(server)
          .post('/settings/users/')
          .send({ email })
          .set('Authorization', `Bearer ${token}`);

        const user = await User.findOne({ email });
        const organizationUser = await OrganizationUsers.findOne({ userId: user?._id });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser?.role).toBe('basic');
        expect(organizationUser?.status).toBe('invited');
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });
        const email = faker.internet.email();

        const response = await request(server)
          .post('/settings/users/')
          .send({ email })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
        expect(response.body.users).toBeUndefined();
      });

      it('fails if email is not passed', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const response = await request(server).post('/settings/users/').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors.email).toContain('Email must be supplied');
      });

      it('fails if email is not a valid email', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const response = await request(server)
          .post('/settings/users/')
          .send({ email: 's@s' })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors.email).toContain('Email must be a valid email address');
      });

      it('fails if email is not unique', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const email = faker.internet.email();
        await createUser({ organizationId, email });

        const response = await request(server)
          .post('/settings/users/')
          .send({ email })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors.email).toContain('Email address is already in use');
      });
    });

    describe('PUT /:id', () => {
      it('successfully updates a users role if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .put(`/settings/users/${userId}`)
          .send({ role: OrganizationRole.ADMIN })
          .set('Authorization', `Bearer ${token}`);

        const organizationUser = await OrganizationUsers.findOne({ userId });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser?.role).toBe('admin');
      });

      it('successfully updates a users role if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .put(`/settings/users/${userId}`)
          .send({ role: OrganizationRole.ADMIN })
          .set('Authorization', `Bearer ${token}`);

        const organizationUser = await OrganizationUsers.findOne({ userId });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser?.role).toBe('admin');
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .put(`/settings/users/${userId}`)
          .send({ role: OrganizationRole.ADMIN })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
      });

      it('fails if id is not a valid id', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const response = await request(server)
          .put(`/settings/users/1`)
          .send({ role: OrganizationRole.ADMIN })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors).toBe('User id must be a valid id');
      });

      it('fails if an admin tries to modify an owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const response = await request(server)
          .put(`/settings/users/${userId}`)
          .send({ role: OrganizationRole.ADMIN })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors.userId).toContain('ADMIN can not modify role of OWNER');
      });

      it('changes owner role to admin if another admin is made owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token, id: oldOwnerId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const { id: newOwnerId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });

        const response = await request(server)
          .put(`/settings/users/${newOwnerId}`)
          .send({ role: OrganizationRole.OWNER })
          .set('Authorization', `Bearer ${token}`);

        const oldOwner = await OrganizationUsers.findOne({ userId: oldOwnerId });
        const newOwner = await OrganizationUsers.findOne({ userId: newOwnerId });

        expect(response.status).toBe(200);
        expect(oldOwner?.role).toBe(OrganizationRole.ADMIN);
        expect(newOwner?.role).toBe(OrganizationRole.OWNER);
      });
    });

    describe('DELETE /:id', () => {
      it('successfully deletes a user and organisation user if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .delete(`/settings/users/${userId}`)
          .set('Authorization', `Bearer ${token}`);

        const organizationUser = await OrganizationUsers.findOne({ userId: userId });
        const deletedUser = await User.findById(userId);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser).toBeNull();
        expect(deletedUser).toBeNull();
      });

      it('successfully deletes a user and organisation user if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .delete(`/settings/users/${userId}`)
          .set('Authorization', `Bearer ${token}`);

        const organizationUser = await OrganizationUsers.findOne({ userId: userId });
        const deletedUser = await User.findById(userId);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(organizationUser).toBeNull();
        expect(deletedUser).toBeNull();
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });
        const { id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .delete(`/settings/users/${userId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
        expect(response.body.users).toBeUndefined();
      });

      it('fails if id is not a valid id', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });

        const response = await request(server).delete(`/settings/users/1`).set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors).toBe('User id must be a valid id');
      });
    });
  });

  describe('/groups', () => {
    describe('GET /', () => {
      it('returns users associated with a company if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        await createGroups({ userId, organizationId, count: 2 });

        const response = await request(server)
          .get('/settings/groups/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.groups).toHaveLength(2);
      });

      it('returns users associated with a company if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        await createGroups({ userId, organizationId, count: 2 });

        const response = await request(server)
          .get('/settings/groups/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.groups).toHaveLength(2);
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });

        const response = await request(server)
          .get('/settings/groups/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
        expect(response.body.groups).toBeUndefined();
      });

      it('returns paginated users', async () => {
        const { id: organizationId } = await createOrganization();
        const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        await createGroups({ userId, organizationId, count: 50 });

        const response = await request(server)
          .get('/settings/groups/')
          .query({ limit: 20, page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.groups).toHaveLength(20);
        expect(response.body.pagination.totalDocuments).toBe(50);
        expect(response.body.pagination.currentPage).toBe(1);
        expect(response.body.pagination.totalPages).toBe(3);
      });
    });

    describe('POST /', () => {
      it('successfully creates a new group with a name if user is organization owner', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const name = faker.name.jobArea();

        const response = await request(server)
          .post('/settings/groups/')
          .send({
            name,
          })
          .set('Authorization', `Bearer ${token}`);

        const group = await Group.findOne({ name });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(group).not.toBe(null);
        expect(group?.name).toBe(name);
      });

      it('successfully creates a new group with a name if user is organization admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
        const name = faker.name.jobArea();

        const response = await request(server)
          .post('/settings/groups/')
          .send({
            name,
          })
          .set('Authorization', `Bearer ${token}`);

        const group = await Group.findOne({ name });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(group).not.toBe(null);
        expect(group?.name).toBe(name);
      });

      it('fails if user is not organization owner or admin', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.BASIC });
        const name = faker.name.jobArea();

        const response = await request(server)
          .post('/settings/groups/')
          .send({
            name,
          })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized request');
        expect(response.body.groups).toBeUndefined();
      });

      it('successfully creates a new group with a description', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const name = faker.name.jobArea();
        const description = faker.lorem.paragraph();

        const response = await request(server)
          .post('/settings/groups/')
          .send({
            name,
            description,
          })
          .set('Authorization', `Bearer ${token}`);

        const group = await Group.findOne({ name });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeUndefined();
        expect(group).not.toBe(null);
        expect(group?.description).toBe(description);
      });

      it('successfully creates a new group with an image', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const name = faker.name.jobArea();
        const image = path.resolve(__dirname, `./assets/logo.png`);

        const response = await request(server)
          .post('/settings/groups/')
          .set('content-type', 'application/octet-stream')
          .set('Authorization', `Bearer ${token}`)
          .field('name', name)
          .attach('image', image);

        const group = await Group.findOne({ name });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeUndefined();
        expect(group).not.toBe(null);
        expect(group?.image).not.toBe(null);
      });

      it('successfully updates users with access to a new group', async () => {
        const { id: organizationId } = await createOrganization();
        const { token } = await createUser({ organizationId, role: OrganizationRole.OWNER });
        const name = faker.name.jobArea();
        const users = await createUsers({ organizationId, count: 2 });
        const groupUsers = users.map((user) => {
          return {
            userId: user.id,
            role: GroupRole.BASIC,
          };
        });

        const response = await request(server)
          .post('/settings/groups/')
          .send({
            name,
            users: groupUsers,
          })
          .set('Authorization', `Bearer ${token}`);

        const group = await Group.findOne({ name });

        expect(response.status).toBe(200);
        expect(response.body.error).toBeUndefined();
        expect(group).not.toBe(null);
      });
    });
  });
});
