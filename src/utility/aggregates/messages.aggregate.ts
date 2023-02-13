import mongoose, { PipelineStage } from 'mongoose';

export const messageAggregate = async ({
  groupId,
  limit,
  currentPage,
  count,
}: {
  groupId: mongoose.Types.ObjectId;
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
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$_id',
        message: '$message',
        createdAt: '$createdAt',
        user: {
          _id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          image: '$user.image',
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    }
  );

  if (count) {
    aggregate.push({ $count: 'totalDocuments' });
  }

  if (limit && currentPage) {
    aggregate.push({ $skip: limit * (currentPage - 1) }, { $limit: limit });
  }

  return aggregate;
};
