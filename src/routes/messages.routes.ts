import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import { permissions } from '../middleware/permissions.middleware';
import { GroupMessages } from '../models';
import { IClient } from '../types/generic.types';
import { messageAggregate } from '../utility/aggregates/messages.aggregate';
import { groupMessagePostValidation } from '../utility/validation/messages.validation';

const router = express.Router();

let clients = [] as IClient[];

const updateAllActiveClients = async ({ groupId }: { groupId: mongoose.Types.ObjectId }) => {
  for (const client of clients) {
    if (client.groupId.toString() === groupId.toString()) {
      const messages = await GroupMessages.aggregate(
        await messageAggregate({ groupId: client.groupId, limit: 20, currentPage: 1 })
      );
      client.response.write(`data: ${JSON.stringify(messages)} \n\n`);
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

router.post('/:groupId/', permissions.groupUser, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(token.userId);
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);
    const { errors, message } = await groupMessagePostValidation({
      message: req.body.message,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    await GroupMessages.create({ message, userId, groupId });

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
