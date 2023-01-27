import 'dotenv/config';

import { Group, GroupUsers, Organization, OrganizationGroup, OrganizationUsers, User } from '../models';
import server from '../server';
import { GroupRole, OrganizationRole } from '../types/roles.types';
import {
  createGroup,
  createGroups,
  createGroupUser,
  createOrganization,
  createUser,
  createUsers
} from '../utility/mock';

import { database } from './config';

import bcrypt from 'bcryptjs';
import path from 'path';
import request from 'supertest';

describe('/group', () => {
  database('slumberhouse-test', server);

  describe('GET /', () => {
    it('returns groups associated with user id', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });

      await createGroups({ userId, organizationId, count: 2 });

      const response = await request(server).get('/group/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('returns a count of users associated with group', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: newUserId } = await createUser({ organizationId, role: OrganizationRole.BASIC });

      const group = await createGroup({ userId, organizationId });
      await createGroupUser({ userId: newUserId, groupId: group.id, role: GroupRole.BASIC });

      const response = await request(server).get('/group/').set('Authorization', `Bearer ${token}`);

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

      const response = await request(server).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${token}`);

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

      const response = await request(server).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${token}`);

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

      const response = await request(server).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${token}`);

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

      const response = await request(server).get(`/group/${group.id}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
      expect(response.body.users).toBeUndefined();
    });
  });
});
