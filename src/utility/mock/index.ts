import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  Group,
  GroupTags,
  GroupUsers,
  Organization,
  OrganizationGroup,
  OrganizationUsers,
  Task,
  TaskTags,
  TaskUsers,
  User,
} from '../../models';
import GroupTasks from '../../models/GroupTasks.model';
import { GroupRole, OrganizationRole } from '../../types/roles.types';
import { TaskPriority, TaskStatus } from '../../types/task.types';
import { UserStatus } from '../../types/user.types';

export const createUsers = async ({ organizationId, count }: { organizationId: string; count: number }) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createUser({ organizationId });
    users.push({ id: user.id, token: user.token });
  }

  return users;
};

export const createUser = async ({
  organizationId,
  email = faker.internet.email().toLowerCase(),
  password = faker.internet.password(),
  role = OrganizationRole.BASIC,
  status = UserStatus.ACTIVE,
}: {
  organizationId: string;
  email?: string;
  password?: string;
  role?: OrganizationRole;
  status?: UserStatus;
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName: faker.name.firstName().toLowerCase(),
    lastName: faker.name.lastName().toLowerCase(),
    email,
    password: hashedPassword,
  });

  await OrganizationUsers.create({
    role,
    status,
    userId: user._id,
    organizationId,
  });

  return {
    id: user._id.toString(),
    token: jwt.sign(
      { userId: user._id, organizationId: new mongoose.Types.ObjectId(organizationId) },
      process.env.JWT_SECRET as string
    ),
    email,
    password,
  };
};

export const createOrganization = async () => {
  const organization = await Organization.create({ name: faker.company.name().toLowerCase() });

  return {
    id: organization._id.toString(),
  };
};

export const createGroups = async ({
  userId,
  organizationId,
  count,
}: {
  userId: string;
  organizationId: string;
  count: number;
}) => {
  const groups = [];
  for (let i = 0; i < count; i++) {
    const group = await createGroup({ userId, organizationId });

    groups.push({ id: group.id, name: group.name });
  }

  return groups;
};

export const createGroup = async ({
  userId,
  organizationId,
  role = GroupRole.BASIC,
}: {
  userId: string;
  organizationId: string;
  role?: GroupRole;
}) => {
  const group = await Group.create({
    name: faker.name.jobArea().toLowerCase(),
    description: faker.lorem.paragraph(),
    image: faker.image.business(640, 480, true),
  });
  await OrganizationGroup.create({ groupId: group._id, organizationId });

  await GroupUsers.create({
    role,
    userId,
    groupId: group._id,
  });

  return {
    id: group._id.toString(),
    name: group.name,
  };
};

export const createGroupUser = async ({
  userId,
  groupId,
  role = GroupRole.BASIC,
}: {
  userId: string;
  groupId: string;
  role?: GroupRole;
}) => {
  const groupUser = await GroupUsers.create({
    role,
    userId,
    groupId,
  });

  return groupUser;
};

export const createTask = async ({ groupId }: { groupId: string }) => {
  const task = await Task.create({
    title: faker.lorem.sentence(),
    status: TaskStatus.BACKLOG,
    description: faker.lorem.paragraph(),
    priority: TaskPriority.LOW,
    due: new Date(),
  });
  await GroupTasks.create({ groupId, taskId: task._id });

  return {
    id: task._id.toString(),
  };
};

export const createTasks = async ({ groupId, count }: { groupId: string; count: number }) => {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const task = await createTask({ groupId });
    tasks.push({ id: task.id });
  }

  return tasks;
};

export const createTags = async ({ groupId, taskId, count }: { groupId: string; taskId: string; count: number }) => {
  const tags = [];
  for (let i = 0; i < count; i++) {
    const tag = await GroupTags.create({ tag: faker.lorem.word().toLowerCase(), groupId });
    await TaskTags.create({ taskId, tagId: tag._id });

    tags.push({ id: tag._id.toString(), tag: tag.tag });
  }

  return tags;
};

export const createTaskUser = async ({ userId, taskId }: { userId: string; taskId: string }) => {
  const taskUser = await TaskUsers.create({ userId, taskId });

  return {
    id: taskUser._id.toString(),
  };
};
