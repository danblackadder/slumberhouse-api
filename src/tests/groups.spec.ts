import request from 'supertest';

import 'dotenv/config';

import { GroupUsers } from '../models';
import server from '../server';
import { GroupRole, OrganizationRole } from '../types/roles.types';
import {
  createGroup,
  createGroups,
  createGroupUser,
  createOrganization,
  createUser,
  createUsers,
} from '../utility/mock';

import { database } from './config';

describe('/group', () => {
  database('slumberhouse-test', server);

  describe('GET /', () => {
    it('returns groups associated with user id', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });

      await createGroups({ userId, organizationId, count: 2 });

      const response = await request(server).get('/groups/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('returns a count of users associated with group', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: newUserId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: newUserId, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server).get('/groups/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body[0].users).toBe(2);
    });
  });

  describe('GET /:id/users', () => {
    it('returns users associated with a group if user is organization owner', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const users = await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      for (const user of users) {
        await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });
      }

      const response = await request(server).get(`/groups/${group.id}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3);
    });

    it('returns users associated with a group if user is organization admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
      const users = await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      for (const user of users) {
        await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });
      }

      const response = await request(server).get(`/groups/${group.id}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3);
    });

    it('returns users associated with a group if user is group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const users = await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId, role: GroupRole.ADMIN });

      for (const user of users) {
        await createGroupUser({ userId: user.id, groupId: group.id });
      }

      const response = await request(server).get(`/groups/${group.id}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3);
    });

    it('fails if user is not organization owner, admin or group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const users = await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      for (const user of users) {
        await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });
      }

      const response = await request(server).get(`/groups/${group.id}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
      expect(response.body.users).toBeUndefined();
    });
  });

  describe('GET /:id/users/available', () => {
    it('returns users associated with a group if user is organization owner', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .get(`/groups/${group.id}/users/available`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('returns users associated with a group if user is organization admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
      await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .get(`/groups/${group.id}/users/available`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('returns users associated with a group if user is group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId, role: GroupRole.ADMIN });

      const response = await request(server)
        .get(`/groups/${group.id}/users/available`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('returns user even if user is in another group', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const users = await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });
      await createGroup({ userId: users[0].id, organizationId });

      const response = await request(server)
        .get(`/groups/${group.id}/users/available`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('fails if user is not organization owner, admin or group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      await createUsers({ organizationId, count: 2 });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .get(`/groups/${group.id}/users/available`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });
  });

  describe('POST /:id/users/:userId', () => {
    it('successfully adds a new user to a group if user is organization owner', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
    });

    it('returns users associated with a group if user is organization admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
    });

    it('returns users associated with a group if user is group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.ADMIN });

      const response = await request(server)
        .post(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
    });

    it('fails if user is not organization owner, admin or group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.BASIC });

      const response = await request(server)
        .post(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
      expect(response.body.users).toBeUndefined();
    });

    it('successfully adds a new user with the desired role', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers?.role).toBe(GroupRole.ADMIN);
    });
  });

  describe('PUT /:id/users/:userId', () => {
    it('successfully updates a user role in a group if user is organization owner', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.BASIC });
      await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
      expect(groupUsers?.role).toBe(GroupRole.ADMIN);
    });

    it('returns users associated with a group if user is organization admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.BASIC });
      await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
      expect(groupUsers?.role).toBe(GroupRole.ADMIN);
    });

    it('returns users associated with a group if user is group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.ADMIN });
      await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      const groupUsers = await GroupUsers.findOne({ groupId: group.id, userId: user.id });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(groupUsers).not.toBeNull();
      expect(groupUsers?.role).toBe(GroupRole.ADMIN);
    });

    it('fails if user is not organization owner, admin or group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.BASIC });
      await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
      expect(response.body.users).toBeUndefined();
    });

    it('fails if no role is provided', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: user.id, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.role).toContain('Role must be provided');
    });

    it('fails if user does not belong to group', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });

      const response = await request(server)
        .put(`/groups/${group.id}/users/${user.id}`)
        .send({ role: GroupRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.group).toContain('User does not belong to group');
    });
  });

  describe('DELETE /:id/users/:userId', () => {
    it('successfully removes a user from a group if user is organization owner', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.OWNER });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: user.id, groupId: group.id });

      const response = await request(server)
        .delete(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
    });

    it('successfully removes a user from a group if user is organization admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.ADMIN });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: user.id, groupId: group.id });

      const response = await request(server)
        .delete(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
    });

    it('successfully removes a user from a group if user is group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId, role: GroupRole.ADMIN });
      await createGroupUser({ userId: user.id, groupId: group.id });

      const response = await request(server)
        .delete(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
    });

    it('fails if user is not organization owner, admin or group admin', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId, role: OrganizationRole.BASIC });
      const user = await createUser({ organizationId });
      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: user.id, groupId: group.id });

      const response = await request(server)
        .delete(`/groups/${group.id}/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });
  });
});
