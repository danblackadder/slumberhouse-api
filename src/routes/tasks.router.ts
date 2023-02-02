import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { permissions } from '../middleware/permissions.middleware';
import { GroupTags, Task, TaskTags, TaskUsers } from '../models';
import GroupTasks from '../models/GroupTasks.model';
import { taskAggregate } from '../utility/aggregates/task.aggregates';
import { groupTaskPostValidation } from '../utility/validation/tasks.validation';

const router = express.Router();

router.get('/:groupId/', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    const tasks = await GroupTasks.aggregate(await taskAggregate({ groupId }));

    res.status(200).send(tasks);
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/:groupId/', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    const { errors, title, description, priority, due, status, tags, users } = await groupTaskPostValidation({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      due: req.body.due,
      status: req.body.status,
      users: req.body.users,
      tags: req.body.tags,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    let tagIds = [] as mongoose.Types.ObjectId[];

    if (tags) {
      for (const tag of tags) {
        const tagExists = await GroupTags.findOne({ tag, groupId });
        if (!tagExists) {
          const newTag = await GroupTags.create({ tag, groupId });
          tagIds.push(newTag._id);
        } else {
          tagIds.push(tagExists._id);
        }
      }
    }

    const task = await Task.create({ title, description, priority, due, status });
    await GroupTasks.create({ taskId: task._id, groupId });

    for (const _id of tagIds) {
      await TaskTags.create({ taskId: task._id, tagId: _id });
    }

    if (users) {
      for (const userId of users) {
        if (!(await TaskUsers.findOne({ taskId: task._id, userId }))) {
          await TaskUsers.create({ taskId: task._id, userId });
        }
      }
    }

    res.status(200).send();
    return;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'CastError') {
      res.status(400).send({ errors: 'Group id must be a valid id' });
      return;
    }

    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
