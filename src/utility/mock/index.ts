import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { Group, GroupUsers, Organization, OrganizationGroup, OrganizationUsers, User } from '../../models';
import { GroupRole, OrganizationRole } from '../../types/roles.types';
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
  status = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.INVITED].sort(() => 0.5 - Math.random()).slice(0, 1)[0],
}: {
  organizationId: string;
  email?: string;
  password?: string;
  role?: OrganizationRole;
  status?: UserStatus;
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
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
    token: jwt.sign({ userId: user._id, organizationId }, process.env.JWT_SECRET as string),
    email,
    password,
  };
};

export const createOrganization = async () => {
  const organization = await Organization.create({ name: faker.company.name() });

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
    name: faker.name.jobArea(),
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
