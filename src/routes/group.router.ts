import express, { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import mongoose from 'mongoose';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { permissions } from '../middleware/permissions.middleware';
import { Group, GroupUsers, GroupWidgets, OrganizationUsers } from '../models';
import { IGetGroupUserFilter, IGetGroupUserSort } from '../types/group.types';
import { GroupRole } from '../types/roles.types';
import {
  groupAggregate,
  groupsAggregate,
  groupUsersAggregate,
  groupUsersAvailableAggregate,
} from '../utility/aggregates/group.aggregates';
import { groupPutValidation, groupUserPutValidation } from '../utility/validation/group.validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(token.userId);
    const groups = await GroupUsers.aggregate(await groupsAggregate({ userId }));

    res.status(200).send(groups);
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(token.userId);
    const groupId = new mongoose.Types.ObjectId(req.params.id);
    const group = await GroupUsers.aggregate(await groupAggregate({ groupId, userId }));

    res.status(200).send(group[0]);
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.put('/:id', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const organizationId = new mongoose.Types.ObjectId(token.organizationId);

    const { errors, name, description, image, widgets, groupId } = await groupPutValidation({
      name: req.body.name,
      description: req.body.description,
      image: req.files?.image as UploadedFile,
      widgets: req.body.widgets.split(','),
      groupId: req.params.id,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const group = await Group.findById(groupId);

    await GroupWidgets.deleteMany({ groupId: group?._id });
    if (widgets) {
      for (const widgetId of widgets) {
        await GroupWidgets.create({ groupId: group?._id, widgetId: widgetId });
      }
    }

    const orgDir = `${__dirname}/../../uploads/${organizationId}`;
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir);
    }

    const groupsDir = `${orgDir}/groups`;
    if (!fs.existsSync(groupsDir)) {
      fs.mkdirSync(groupsDir);
    }

    const groupDir = `${groupsDir}/${groupId}`;
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir);
    }

    const fullDir = `${groupDir}`;

    if (image && group?.image) {
      if (group.image.includes('localhost'))
        fs.unlink(`${fullDir}/${group?.image.split('/')[4]}`, (err) => {
          if (err) throw err;
        });
    }

    let filename;
    if (image) {
      filename = `${uuidv4()}.${image?.name.split('.')[1]}`;
      if (process.env.NODE_ENV !== 'test') {
        image.mv(`${fullDir}/${filename}`);
      }
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${organizationId}/groups/${groupId}`;

    await Group.findByIdAndUpdate(groupId, {
      name,
      description,
      image: `${fullUrl}/${filename}`,
    });

    res.status(200).send();
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
    const sort = {
      name: Number(req.query.sortName) || 0,
      email: Number(req.query.sortEmail) || 0,
      role: Number(req.query.sortRole) || 0,
    } as IGetGroupUserSort;
    const filter = {
      nameEmail: req.query.filterNameEmail,
      role: req.query.filterRole,
    } as IGetGroupUserFilter;

    const aggregate = await GroupUsers.aggregate(
      await groupUsersAggregate({ groupId, sort, filter, limit, currentPage })
    );

    const totalAggregate = await GroupUsers.aggregate(
      await groupUsersAggregate({ groupId, sort, filter, count: true })
    );

    let totalDocuments = 0;
    if (totalAggregate[0]?.totalDocuments > 0) {
      totalDocuments = totalAggregate[0].totalDocuments;
    }

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

    const users = await OrganizationUsers.aggregate(await groupUsersAvailableAggregate({ organizationId, groupId }));

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

router.put('/:id/users/:userId', permissions.groupAdmin, async (req: Request, res: Response) => {
  try {
    const { errors, role } = await groupUserPutValidation({
      role: req.body.role,
      groupId: req.params.id,
      userId: req.params.userId,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const groupId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    await GroupUsers.findOneAndUpdate({ groupId, userId }, { role });

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
