import mongoose, { PipelineStage } from 'mongoose';

import { OrganizationUsers } from '../../../models';
import { OrganizationRole } from '../../../types/roles.types';
import { IGetSettingsUserFilter, IGetSettingsUserSort } from '../../../types/settings.types';
import { UserStatus } from '../../../types/user.types';

export const userSettingAggregate = async ({
  userId,
  sort,
  filter,
  limit,
  currentPage,
  count,
}: {
  userId: string;
  sort: IGetSettingsUserSort;
  filter: IGetSettingsUserFilter;
  limit?: number;
  currentPage?: number;
  count?: boolean;
}) => {
  const id = new mongoose.Types.ObjectId(userId);
  const user = await OrganizationUsers.findOne({ userId: id });

  const aggregate = [] as PipelineStage[];
  aggregate.push({ $match: { organizationId: user?.organizationId } });

  aggregate.push(
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$user._id',
        role: '$role',
        status: '$status',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
      },
    },
    {
      $addFields: {
        role_sort: {
          $switch: {
            branches: [
              { case: { $eq: ['$role', OrganizationRole.OWNER] }, then: 0 },
              { case: { $eq: ['$role', OrganizationRole.ADMIN] }, then: 1 },
              { case: { $eq: ['$role', OrganizationRole.BASIC] }, then: 2 },
            ],
            default: 3,
          },
        },
      },
    },
    {
      $addFields: {
        status_sort: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', UserStatus.ACTIVE] }, then: 0 },
              { case: { $eq: ['$status', UserStatus.INVITED] }, then: 1 },
              { case: { $eq: ['$status', UserStatus.INACTIVE] }, then: 2 },
            ],
            default: 3,
          },
        },
      },
    }
  );

  if (filter.nameEmail) {
    aggregate.push({
      $match: {
        $or: [
          { firstName: { $regex: filter.nameEmail } },
          { lastName: { $regex: filter.nameEmail } },
          { email: { $regex: filter.nameEmail } },
        ],
      },
    });
  }

  if (filter.role) {
    aggregate.push({
      $match: { role: filter.role },
    });
  }

  if (filter.status) {
    aggregate.push({
      $match: { status: filter.status },
    });
  }

  if (sort.name === 1 || sort.name === -1) {
    aggregate.push({
      $sort: {
        firstName: sort.name,
      },
    });
  }

  if (sort.email === 1 || sort.email === -1) {
    aggregate.push({
      $sort: {
        email: sort.email,
      },
    });
  }

  if (sort.role === 1 || sort.role === -1) {
    aggregate.push({
      $sort: {
        role_sort: sort.role,
        firstName: 1,
      },
    });
  }

  if (sort.status === 1 || sort.status === -1) {
    aggregate.push({
      $sort: {
        status_sort: sort.status,
        firstName: 1,
      },
    });
  }

  if (sort.name === 0 && sort.email === 0 && sort.role === 0 && sort.status === 0) {
    aggregate.push({
      $sort: {
        role_sort: 1,
        firstName: 1,
      },
    });
  }

  aggregate.push({ $unset: 'role_sort' }, { $unset: 'status_sort' });

  if (count) {
    aggregate.push({ $count: 'totalDocuments' });
  }

  if (limit && currentPage) {
    aggregate.push({ $skip: limit * (currentPage - 1) }, { $limit: limit });
  }

  return aggregate;
};
