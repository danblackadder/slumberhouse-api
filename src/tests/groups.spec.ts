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

  describe.only('POST /:id/users/:userId', () => {
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
});
