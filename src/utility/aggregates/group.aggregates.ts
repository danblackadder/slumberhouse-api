import mongoose, { PipelineStage } from 'mongoose';
import { IGetGroupUserFilter, IGetGroupUserSort } from '../../types/group.types';
import { OrganizationRole } from '../../types/roles.types';

export const groupAggregate = async ({ userId }: { userId: mongoose.Types.ObjectId }) => {
  const aggregate = [] as PipelineStage[];
  aggregate.push(
    { $match: { userId } },
    {
      $lookup: {
        from: 'groups',
        localField: 'groupId',
        foreignField: '_id',
        as: 'group',
      },
    },
    { $unwind: '$group' },
    {
      $lookup: {
        from: 'groupusers',
        localField: 'groupId',
        foreignField: 'groupId',
        as: 'users',
      },
    },
    {
      $project: {
        _id: '$group._id',
        name: '$group.name',
        description: '$group.description',
        image: '$group.image',
        role: '$role',
        users: { $size: '$users' },
      },
    }
  );

  return aggregate;
};

export const groupUsersAggregate = async ({
  groupId,
  sort,
  filter,
  limit,
  currentPage,
  count,
}: {
  groupId: mongoose.Types.ObjectId;
  sort: IGetGroupUserSort;
  filter: IGetGroupUserFilter;
  limit?: number;
  currentPage?: number;
  count?: boolean;
}) => {
  const aggregate = [] as PipelineStage[];
  aggregate.push(
    { $match: { groupId } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'users',
      },
    },
    { $unwind: '$users' },
    {
      $project: {
        _id: '$users._id',
        firstName: '$users.firstName',
        lastName: '$users.lastName',
        email: '$users.email',
        role: '$role',
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

  if (sort.name === 0 && sort.email === 0 && sort.role === 0) {
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

export const groupUsersAvailableAggregate = async ({
  organizationId,
  groupId,
}: {
  organizationId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
}) => {
  const aggregate = [] as PipelineStage[];
  aggregate.push(
    { $match: { organizationId } },
    {
      $lookup: {
        from: 'groupusers',
        localField: 'userId',
        foreignField: 'userId',
        as: 'groupusers',
      },
    },
    { $match: { $or: [{ groupusers: [] }, { groupusers: { $not: { $elemMatch: { groupId } } } }] } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'users',
      },
    },
    { $unwind: '$users' },
    {
      $project: {
        _id: '$users._id',
        firstName: '$users.firstName',
        lastName: '$users.lastName',
        email: '$users.email',
      },
    }
  );

  return aggregate;
};
