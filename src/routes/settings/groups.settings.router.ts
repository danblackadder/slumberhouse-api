import express, { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import mongoose from 'mongoose';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { Group, GroupUsers, OrganizationGroup, OrganizationUsers } from '../../models';
import { IGetSettingsGroupFilter, IGetSettingsGroupSort } from '../../types/settings.types';
import { groupSettingAggregate } from '../../utility/aggregates/settings/group.settings.aggregates';
import { groupPostValidation } from '../../utility/validation/group.validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const limit = Number(req.query.limit) || 10;
    const currentPage = Number(req.query.page) || 1;
    const sort = {
      name: Number(req.query.sortName) || 0,
      users: Number(req.query.sortUsers) || 0,
    } as IGetSettingsGroupSort;
    const filter = {
      name: req.query.filterName,
    } as IGetSettingsGroupFilter;

    const aggregate = await OrganizationGroup.aggregate(
      await groupSettingAggregate({ userId: token.userId, sort, filter, limit, currentPage })
    );

    const totalAggregate = await OrganizationGroup.aggregate(
      await groupSettingAggregate({ userId: token.userId, sort, filter, count: true })
    );

    let totalDocuments = 0;
    if (totalAggregate[0]?.totalDocuments > 0) {
      totalDocuments = totalAggregate[0].totalDocuments;
    }

    res.status(200).send({
      groups: aggregate,
      pagination: { totalDocuments, totalPages: Math.ceil(totalDocuments / limit), currentPage, limit },
    });
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const organizationId = new mongoose.Types.ObjectId(token.organizationId);

    const { errors, name, description, image, users } = await groupPostValidation({
      name: req.body.name,
      description: req.body.description,
      image: req.files?.image as UploadedFile,
      users: req.body.users,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const organization = await OrganizationUsers.findOne({ userId: req.body.token.userId });
    const group = await Group.create({ name, description });

    if (users) {
      for (const user of users) {
        await GroupUsers.create({
          role: user.role,
          userId: user.userId,
          groupId: group._id,
        });
      }
    }

    await OrganizationGroup.create({
      organizationId: organization?.organizationId,
      groupId: group?._id,
    });
    const orgDir = `${__dirname}/../../../uploads/${organizationId}`;
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir);
    }

    const groupsDir = `${orgDir}/groups`;
    if (!fs.existsSync(groupsDir)) {
      fs.mkdirSync(groupsDir);
    }

    const groupDir = `${groupsDir}/${group._id}`;
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir);
    }

    const fullDir = `${groupDir}`;

    let filename;
    if (image) {
      filename = `${uuidv4()}.${image?.name.split('.')[1]}`;
      if (process.env.NODE_ENV !== 'test') {
        image.mv(`${fullDir}/${filename}`);
      }
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${organizationId}/groups/${group._id}`;

    await Group.findByIdAndUpdate(group._id, { image: `${fullUrl}/${filename}` });

    res.status(200).send();
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id;

    await OrganizationGroup.deleteMany({ groupId });
    await GroupUsers.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    res.status(200).send();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'CastError') {
      res.status(400).send({ errors: 'User id must be a valid id' });
      return;
    }

    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
