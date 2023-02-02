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
      $project: {
        _id: '$tasks._id',
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
      },
    }
  );

  return aggregate;
};
