import '../database';
import { exit } from 'process';
import { createOrganization, createUser, createUsers, createGroups } from '../utility/mock';
import { OrganizationRole, UserStatus } from '../types';

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

    await createUsers({ organizationId, count: 50 });
    await createGroups({ userId, organizationId, count: 10 });

    console.log(`Owner account:\nEmail: ${ownerEmail}\n`);
    console.log(`Admin account:\nEmail: ${adminEmail}\n`);
    console.log(`Basic account:\nEmail: ${basicEmail}\n`);
    console.log(`Password for all accounts: ${password}`);
    exit();
  })();
} catch (err: any) {
  console.log(err);
}
