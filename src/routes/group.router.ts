import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import { permissions } from '../middleware/permissions.middleware';
import { GroupUsers, OrganizationUsers } from '../models';
import { GroupRole } from '../types/roles.types';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const id = new mongoose.Types.ObjectId(token.userId);

    const groups = await GroupUsers.aggregate([
      { $match: { userId: id } },
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
      },
    ]);

    res.status(200).send(groups);
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/:id/users', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.id);
    const limit = Number(req.query.limit) || 10;
    const currentPage = Number(req.query.page) || 1;

    const aggregate = await GroupUsers.aggregate([
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
      { $skip: limit * (currentPage - 1) },
      { $limit: limit },
    ]);

    const totalDocuments = await GroupUsers.countDocuments({ groupId });

    res.status(200).send({
      users: aggregate,
      pagination: { totalDocuments, totalPages: Math.ceil(totalDocuments / limit), currentPage, limit },
    });
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/:id/users/available', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const organizationId = new mongoose.Types.ObjectId(token.organizationId);
    const groupId = new mongoose.Types.ObjectId(req.params.id);

    const users = await OrganizationUsers.aggregate([
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
      },
    ]);

    console.log(users);

    res.status(200).send(users);
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/:id/users/:userId', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await GroupUsers.create({ groupId, userId, role: req.body.role || GroupRole.BASIC });

    res.status(200).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'CastError') {
      res.status(400).send({ errors: 'User and Group id must be a valid id' });
      return;
    }
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
  }
});

router.delete('/:id/users/:userId', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await GroupUsers.deleteOne({ groupId, userId });

    res.status(200).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'CastError') {
      res.status(400).send({ errors: 'User and Group id must be a valid id' });
      return;
    }

    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
