import mongoose, { PipelineStage } from 'mongoose';

export const taskAggregate = async ({ groupId }: { groupId: mongoose.Types.ObjectId }) => {
  const aggregate = [] as PipelineStage[];
  aggregate.push(
    { $match: { groupId } },
    {
      $lookup: {
        from: 'tasks',
        localField: 'taskId',
        foreignField: '_id',
        as: 'tasks',
      },
    },
    { $unwind: '$tasks' },
    {
      $lookup: {
        from: 'tasktags',
        localField: 'taskId',
        foreignField: 'taskId',
        as: 'taskTags',
      },
    },
    {
      $lookup: {
        from: 'grouptags',
        localField: 'taskTags.tagId',
        foreignField: '_id',
        as: 'tags',
      },
    },
    {
      $lookup: {
        from: 'taskusers',
        localField: 'taskId',
        foreignField: 'taskId',
        as: 'taskUsers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'taskUsers.userId',
        foreignField: '_id',
        as: 'users',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'tasks.createdByUserId',
        foreignField: '_id',
        as: 'createdUser',
      },
    },
    { $unwind: '$createdUser' },
    {
      $lookup: {
        from: 'users',
        localField: 'tasks.updatedByUserId',
        foreignField: '_id',
        as: 'updatedUser',
      },
    },
    { $unwind: '$updatedUser' },
    {
      $project: {
        _id: '$tasks._id',
        createdAt: '$tasks.createdAt',
        updatedAt: '$tasks.updatedAt',
        title: '$tasks.title',
        status: '$tasks.status',
        description: '$tasks.description',
        priority: '$tasks.priority',
        due: '$tasks.due',
        tags: {
          $reduce: {
            input: '$tags',
            initialValue: [],
            in: {
              $concatArrays: ['$$value', ['$$this.tag']],
            },
          },
        },
        users: {
          $map: {
            input: '$users',
            as: 'user',
            in: {
              _id: '$$user._id',
              firstName: '$$user.firstName',
              lastName: '$$user.lastName',
              email: '$$user.email',
            },
          },
        },
        createdBy: {
          _id: '$createdUser._id',
          firstName: '$createdUser.firstName',
          lastName: '$createdUser.lastName',
          email: '$createdUser.email',
        },
        updatedBy: {
          _id: '$updatedUser._id',
          firstName: '$updatedUser.firstName',
          lastName: '$updatedUser.lastName',
          email: '$updatedUser.email',
        },
      },
    }
  );

  return aggregate;
};

export const taskUserAggregate = async ({ groupId }: { groupId: mongoose.Types.ObjectId }) => {
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
      },
    },
    {
      $sort: {
        firstName: 1,
        lastName: 1,
      },
    }
  );

  return aggregate;
};
