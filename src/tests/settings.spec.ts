import 'dotenv/config';
import request from 'supertest';
import bcrypt from 'bcryptjs';

import server from '../server';
import { database } from './config';
import { createOrganization, createUser, createUsers } from '../utility/mock';
import { OrganizationUsers, User } from '../models';
import { OrganizationRole, UserStatus } from '../types';
import { faker } from '@faker-js/faker';

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

        const response = await request(server)
          .post('/settings/users/')
          .set('Authorization', `Bearer ${token}`);

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

        const response = await request(server)
          .delete(`/settings/users/1`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.errors).toBe('User id must be a valid id');
      });
    });
  });
});
