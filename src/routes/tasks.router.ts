import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import { permissions } from '../middleware/permissions.middleware';
import { GroupTags, GroupUsers, Task, TaskTags, TaskUsers } from '../models';
import GroupTasks from '../models/GroupTasks.model';
import { taskAggregate, taskUserAggregate } from '../utility/aggregates/task.aggregates';
import { groupTaskPostValidation } from '../utility/validation/tasks.validation';

const router = express.Router();

interface IClient {
  id: number;
  groupId: mongoose.Types.ObjectId;
  response: Response;
}

let clients = [] as IClient[];

const updateAllActiveClients = async ({ groupId }: { groupId: mongoose.Types.ObjectId }) => {
  for (const client of clients) {
    if (client.groupId.toString() === groupId.toString()) {
      const tasks = await GroupTasks.aggregate(await taskAggregate({ groupId: client.groupId }));
      client.response.write(`data: ${JSON.stringify(tasks)} \n\n`);
    }
  }
};

router.get('/:groupId/', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    });

    const groupId = new mongoose.Types.ObjectId(req.params.groupId);

    const clientId = Date.now();
    clients.push({
      id: clientId,
      groupId,
      response: res,
    });

    updateAllActiveClients({ groupId });

    res.on('close', () => {
      clients = clients.filter((client) => client.id !== clientId);
      res.end();
    });
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/:groupId/tags', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    console.log(groupId);
    const groupTags = await GroupTags.find({ groupId });
    console.log(groupTags.map((tag) => tag.tag));

    res.status(200).send(groupTags.map((tag) => tag.tag));
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/:groupId/users', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    console.log(groupId);
    const users = await GroupUsers.aggregate(await taskUserAggregate({ groupId }));
    console.log(users);

    res.status(200).send(users);
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/:groupId/', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(token.userId);
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

    const tagIds = [] as mongoose.Types.ObjectId[];

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

    const task = await Task.create({
      title,
      description,
      priority,
      due,
      status,
      createdByUserId: userId,
      updatedByUserId: userId,
    });
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

    updateAllActiveClients({ groupId });
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
