import mongoose, { PipelineStage } from 'mongoose';
import { OrganizationUsers } from '../../../models';
import { IGetSettingsGroupFilter, IGetSettingsGroupSort } from '../../../types/settings.types';

export const groupSettingAggregate = async ({
  userId,
  sort,
  filter,
  limit,
  currentPage,
  count,
}: {
  userId: string;
  sort: IGetSettingsGroupSort;
  filter: IGetSettingsGroupFilter;
  limit?: number;
  currentPage?: number;
  count?: boolean;
}) => {
  const id = new mongoose.Types.ObjectId(userId);
  const organization = await OrganizationUsers.findOne({ userId: id });

  const aggregate = [] as PipelineStage[];
  aggregate.push({ $match: { organizationId: organization?.organizationId } });

  aggregate.push(
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
        users: { $size: '$users' },
      },
    }
  );

  if (filter.name) {
    aggregate.push({
      $match: { name: { $regex: filter.name } },
    });
  }

  if (sort.name === 1 || sort.name === -1) {
    aggregate.push({
      $sort: {
        name: sort.name,
      },
    });
  }

  if (sort.users === 1 || sort.users === -1) {
    aggregate.push({
      $sort: {
        users: sort.users,
      },
    });
  }

  if (sort.name === 0 && sort.users === 0) {
    aggregate.push({
      $sort: {
        users: 1,
        name: 1,
      },
    });
  }

  if (count) {
    aggregate.push({ $count: 'totalDocuments' });
  }

  if (limit && currentPage) {
    aggregate.push({ $skip: limit * (currentPage - 1) }, { $limit: limit });
  }

  return aggregate;
};
