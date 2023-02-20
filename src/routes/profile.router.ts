import express, { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import mongoose from 'mongoose';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import 'dotenv/config';

import { OrganizationUsers, User } from '../models';
import { profilePutValidation } from '../utility/validation/profile.validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const id = new mongoose.Types.ObjectId(token.userId);

    const user = await OrganizationUsers.aggregate([
      { $match: { userId: id } },
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
        $lookup: {
          from: 'organizations',
          localField: 'organizationId',
          foreignField: '_id',
          as: 'organization',
        },
      },
      { $unwind: '$organization' },
      {
        $lookup: {
          from: 'groupusers',
          localField: 'userId',
          foreignField: 'userId',
          as: 'usergroups',
        },
      },
      {
        $project: {
          _id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          role: '$role',
          organizationId: '$organization._id',
          organization: '$organization.name',
          image: '$user.image',
        },
      },
    ]);

    res.status(200).send(user[0]);
    return;
  } catch (err: unknown) {
    res.status(400).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = new mongoose.Types.ObjectId(token.userId);
    const organizationId = new mongoose.Types.ObjectId(token.organizationId);

    const { errors, firstName, lastName, email, image } = await profilePutValidation({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      image: req.files?.image as UploadedFile,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const user = await User.findById(userId);

    const orgDir = `${__dirname}/../../uploads/${organizationId}`;
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir);
    }

    const profileDir = `${orgDir}/profile`;
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir);
    }

    const userDir = `${profileDir}/${userId}`;
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir);
    }

    const fullDir = `${userDir}`;

    if (image && user?.image) {
      if (user.image.includes('localhost')) {
        fs.unlink(`${fullDir}/${user?.image.split('/')[7]}`, (err) => {
          if (err) throw err;
        });
      }
    }

    let filename;
    if (image) {
      filename = `${uuidv4()}.${image?.name.split('.')[1]}`;
      if (process.env.NODE_ENV !== 'test') {
        image.mv(`${fullDir}/${filename}`);
      }
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${organizationId}/profile/${userId}`;

    await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      email,
      image: `${fullUrl}/${filename}`,
    });

    res.status(200).send();
    return;
  } catch (err: unknown) {
    console.log(err);
    res.status(400).send({ error: 'an unknown error occured' });
    return;
  }
});

export default router;
