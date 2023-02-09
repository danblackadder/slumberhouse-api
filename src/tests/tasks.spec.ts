import request from 'supertest';
import { faker } from '@faker-js/faker';
import EventSource from 'eventsource';

import 'dotenv/config';

import { GroupTags, GroupTasks, Task, TaskUsers } from '../models';
import server, { url } from '../server';
import { IEventSourceTask, TaskPriority, TaskStatus } from '../types/task.types';
import {
  createGroup,
  createGroupUser,
  createOrganization,
  createTags,
  createTask,
  createTasks,
  createTaskUser,
  createUser,
  createUsers,
} from '../utility/mock';

import { database } from './config';
import { GroupRole } from '../types/roles.types';

describe('/tasks', () => {
  database('slumberhouse-test', server);

  describe('GET /:groupId', () => {
    it('returns tasks associated with group id', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      await createTasks({ groupId, userId, count: 2 });

      const eventSourceInitDict = { headers: { Cookie: `token=${token}` } };
      const source = new EventSource(`${url}/tasks/${groupId}`, eventSourceInitDict);

      const response = await new Promise<IEventSourceTask>((resolve, reject) => {
        source.onmessage = (e) => {
          source.close();
          resolve({ body: JSON.parse(e.data) });
        };

        source.onerror = function (err) {
          source.close();
          reject({ error: err });
        };
      });

      expect(response.body).toHaveLength(2);
      expect(response.error).toBeUndefined();
    });

    it('returns tags associated with tasks', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      const { id: taskId } = await createTask({ groupId, userId });
      const tags = await createTags({ groupId, taskId, count: 2 });

      const eventSourceInitDict = { headers: { Cookie: `token=${token}` } };
      const source = new EventSource(`${url}/tasks/${groupId}`, eventSourceInitDict);

      const response = await new Promise<IEventSourceTask>((resolve, reject) => {
        source.onmessage = (e) => {
          source.close();
          resolve({ body: JSON.parse(e.data) });
        };

        source.onerror = function (err) {
          source.close();
          reject({ error: err });
        };
      });

      expect(response.body).toHaveLength(1);
      expect(response.body[0].tags).toContain(tags[0].tag);
      expect(response.body[0].tags).toContain(tags[1].tag);
    });

    it('returns users associated with tasks', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId, email } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      const { id: taskId } = await createTask({ groupId, userId });
      await createTaskUser({ userId, taskId });

      const eventSourceInitDict = { headers: { Cookie: `token=${token}` } };
      const source = new EventSource(`${url}/tasks/${groupId}`, eventSourceInitDict);

      const response = await new Promise<IEventSourceTask>((resolve, reject) => {
        source.onmessage = (e) => {
          source.close();
          resolve({ body: JSON.parse(e.data) });
        };

        source.onerror = function (err) {
          source.close();
          reject({ error: err });
        };
      });

      expect(response.body).toHaveLength(1);
      expect(response.body[0].users).toHaveLength(1);
      expect(response.body[0].users[0].email).toBe(email);
    });
  });

  describe('POST /:groupId', () => {
    it('creates a new task if user if user belongs to group', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status })
        .set('Authorization', `Bearer ${token}`);

      const task = await Task.findOne({});
      const groupTask = await GroupTasks.findOne({});

      expect(response.status).toBe(200);
      expect(task?.title).toBe(title);
      expect(task?.status).toBe(status);
      expect(groupTask?.groupId.toString()).toBe(groupId.toString());
      expect(groupTask?.taskId.toString()).toBe(task?._id.toString());
    });

    it('fails to create a task without a title', async () => {
      const status = TaskStatus.BACKLOG;

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ status })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.title).toContain('Title must be provided');
    });

    it('fails to create a task without a status', async () => {
      const title = faker.lorem.sentence();

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.errors.status).toContain('Status must be provided');
    });

    it('fails to create a new task if user does not belongs to group', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;

      const { id: organizationId } = await createOrganization();
      const { id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const { token } = await createUser({ organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });

    it('creates a new task with a description', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;
      const description = faker.lorem.paragraph();

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, description })
        .set('Authorization', `Bearer ${token}`);

      const task = await Task.findOne({});

      expect(response.status).toBe(200);
      expect(task?.description).toBe(description);
    });

    it('creates a new task with a priority', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;
      const priority = TaskPriority.LOW;

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, priority })
        .set('Authorization', `Bearer ${token}`);

      const task = await Task.findOne({});

      expect(response.status).toBe(200);
      expect(task?.priority).toBe(priority);
    });

    it('creates a new task with a due date', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;
      const due = new Date();

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, due })
        .set('Authorization', `Bearer ${token}`);

      const task = await Task.findOne({});

      expect(response.status).toBe(200);
      expect(task?.due.toString()).toBe(due.toString());
    });

    it('creates a new task with tags', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;
      const tags = [faker.lorem.word(), faker.lorem.word()];

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, tags })
        .set('Authorization', `Bearer ${token}`);

      const groupTags = [] as string[];
      for (const tag of tags) {
        const groupTag = await GroupTags.findOne({ groupId, tag });
        if (groupTag) {
          groupTags.push(groupTag?.tag);
        }
      }

      expect(response.status).toBe(200);
      expect(groupTags).toHaveLength(2);
      expect(groupTags[0]).toBe(tags[0]);
      expect(groupTags[1]).toBe(tags[1]);
    });

    it('only creates reference to a single tag if a tag is duplicated', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;
      const duplicatedTag = faker.lorem.word();
      const tags = [faker.lorem.word(), duplicatedTag, duplicatedTag];

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, tags })
        .set('Authorization', `Bearer ${token}`);

      const groupTags = await GroupTags.find({ groupId });

      expect(response.status).toBe(200);
      expect(groupTags).toHaveLength(2);
      expect(groupTags[0].tag).toBe(tags[0]);
      expect(groupTags[1].tag).toBe(tags[1]);
    });

    it('creates a new task with users', async () => {
      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;

      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      const users = await createUsers({ organizationId, count: 2 });

      const response = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status, users: users.map((user) => user.id) })
        .set('Authorization', `Bearer ${token}`);

      const groupTask = await GroupTasks.findOne({ groupId });
      const taskUsers = await TaskUsers.find({ taskId: groupTask?.taskId });

      expect(response.status).toBe(200);
      expect(taskUsers).toHaveLength(2);
      expect(taskUsers[0].userId.toString()).toBe(users[0].id);
      expect(taskUsers[1].userId.toString()).toBe(users[1].id);
    });
  });

  describe('GET /:groupId/tags', () => {
    it('returns tags associated with a groupId', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      const { id: taskId } = await createTask({ groupId, userId });
      const tags = await createTags({ groupId, taskId, count: 2 });

      const response = await request(server).get(`/tasks/${groupId}/tags`).set('Authorization', `Bearer ${token}`);

      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toBe(tags[0].tag);
      expect(response.body[1]).toBe(tags[1].tag);
    });
  });

  describe('GET /:groupId/users', () => {
    it('returns users associated with a groupId', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      const users = await createUsers({ organizationId, count: 2 });

      for (const user of users) {
        await createGroupUser({ userId: user.id, groupId, role: GroupRole.BASIC });
      }

      const response = await request(server).get(`/tasks/${groupId}/users`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
    });
  });

  describe.only('GET /:groupId EventSource update', () => {
    it('returns updated tasks associated with group id on successful POST', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, id: userId } = await createUser({ organizationId });
      const { id: groupId } = await createGroup({ userId, organizationId });
      await createTasks({ groupId, userId, count: 2 });

      const eventSourceInitDict = { headers: { Cookie: `token=${token}` } };
      const source = new EventSource(`${url}/tasks/${groupId}`, eventSourceInitDict);

      const responseSource = await new Promise<IEventSourceTask>((resolve, reject) => {
        source.onmessage = (e) => {
          resolve({ body: JSON.parse(e.data) });
        };

        source.onerror = function (err) {
          reject({ error: err });
        };
      });

      console.log(responseSource.body);
      expect(responseSource.body).toHaveLength(2);
      expect(responseSource.error).toBeUndefined();

      const title = faker.lorem.sentence();
      const status = TaskStatus.BACKLOG;

      const responsePost = await request(server)
        .post(`/tasks/${groupId}`)
        .send({ title, status })
        .set('Authorization', `Bearer ${token}`);

      const responseSourcePost = await new Promise<IEventSourceTask>((resolve, reject) => {
        source.onmessage = (e) => {
          source.close();
          resolve({ body: JSON.parse(e.data) });
        };

        source.onerror = function (err) {
          source.close();
          reject({ error: err });
        };
      });

      expect(responsePost.status).toBe(200);
      expect(responseSourcePost.body).toHaveLength(3);
      expect(responseSourcePost.error).toBeUndefined();
    });
  });
});
