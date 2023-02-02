import { exit } from 'process';

import '../database';

import { OrganizationRole } from '../types/roles.types';
import { UserStatus } from '../types/user.types';
import { randomNumber, shuffleArray } from '../utility';
import {
  createGroups,
  createOrganization,
  createTags,
  createTasks,
  createTaskUser,
  createUser,
  createUsers,
} from '../utility/mock';

try {
  (async () => {
    const { id: organizationId } = await createOrganization();
    const password = 'password';
    const { id: userId, email: ownerEmail } = await createUser({
      organizationId,
      email: 'owner@slumberhouse.com',
      password,
      role: OrganizationRole.OWNER,
      status: UserStatus.ACTIVE,
    });

    const { email: adminEmail } = await createUser({
      organizationId,
      email: 'admin@slumberhouse.com',
      password,
      role: OrganizationRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    const { email: basicEmail } = await createUser({
      organizationId,
      email: 'basic@slumberhouse.com',
      password,
      role: OrganizationRole.BASIC,
      status: UserStatus.ACTIVE,
    });

    const users = await createUsers({ organizationId, count: 50 });
    const groups = await createGroups({ userId, organizationId, count: 10 });
    for (const group of groups) {
      const tasks = await createTasks({ groupId: group.id, count: randomNumber(10) });

      for (const task of tasks) {
        await createTags({ groupId: group.id, taskId: task.id, count: randomNumber(3) });

        const randomUsers = shuffleArray(users.map((user) => user.id)).slice(0, randomNumber(10));
        for (const userId of randomUsers) {
          await createTaskUser({ taskId: task.id, userId });
        }
      }
    }

    console.log(`Owner account:\nEmail: ${ownerEmail}\n`);
    console.log(`Admin account:\nEmail: ${adminEmail}\n`);
    console.log(`Basic account:\nEmail: ${basicEmail}\n`);
    console.log(`Password for all accounts: ${password}`);
    exit();
  })();
} catch (err: unknown) {
  console.log(err);
}
