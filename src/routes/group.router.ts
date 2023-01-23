import express, { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

import { Group, GroupUsers, Organization, OrganizationGroup, OrganizationUsers, User } from '../models';
import { GroupRole } from '../types';
import { groupValidation } from '../utility/validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const id = new mongoose.Types.ObjectId(token.id);

    const groups = await GroupUsers.aggregate()
      .match({ userId: id })
      .lookup({
        from: 'groups',
        localField: 'groupId',
        foreignField: '_id',
        as: 'group',
      })
      .unwind('$group')
      .lookup({
        from: 'groupusers',
        localField: 'groupId',
        foreignField: 'groupId',
        as: 'users',
      })
      .project({
        _id: '$group._id',
        name: '$group.name',
        description: '$group.description',
        image: '$group.image',
        users: { $size: '$users' },
      });

    res.status(200).send(groups);
    return;
  } catch (err: any) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { errors, name, description, image } = await groupValidation({
      name: req.body.name,
      description: req.body.description,
      image: req.files?.image as UploadedFile,
    });

    if (Object.values(errors).some((value) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    let filename;
    if (image) {
      filename = `${uuidv4()}.${image?.name.split('.')[1]}`;
      if (process.env.NODE_ENV !== 'test') {
        image.mv(`${__dirname}/../../uploads/${filename}`);
      }
    }

    const organization = await OrganizationUsers.findOne({ userId: req.body.token.id });
    const group = await Group.create({ name, description, image: filename });
    await GroupUsers.create({
      role: GroupRole.ADMIN,
      userId: req.body.token.id,
      groupId: group._id,
    });
    await OrganizationGroup.create({
      organizationId: organization?.organizationId,
      groupId: group?._id,
    });

    res.status(200).send();
    return;
  } catch (err: any) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
