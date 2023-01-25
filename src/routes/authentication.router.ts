import 'dotenv/config';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import mongoose from 'mongoose';

import { User, Organization, OrganizationUsers } from '../models';
import { authValidation } from '../utility/validation';
import { verifyToken } from '../middleware';
import { OrganizationRole, UserStatus } from '../types';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { errors, firstName, lastName, email, password, organization } = await authValidation({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      passwordConfirmation: req.body.passwordConfirmation,
      organization: req.body.organization,
    });

    if (Object.values(errors).some((value) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const hashedPassword = await bcrypt.hash(password as string, 10);
    const userCreate = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const orgCreate = await Organization.create({
      name: organization,
    });

    await OrganizationUsers.create({
      role: OrganizationRole.OWNER,
      status: UserStatus.ACTIVE,
      userId: userCreate._id,
      organizationId: orgCreate._id,
    });

    res.status(200).send();
    return;
  } catch (err: any) {
    res.status(400).send({ error: 'an unknown error occured' });
    return;
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    email = validator.escape(email);
    const user = await User.findOne({ email: email });
    if (user) {
      if (await bcrypt.compare(password, user.password as string)) {
        const organization = await OrganizationUsers.findOne({ userId: user._id });
        res.status(200).send({
          token: jwt.sign(
            { userId: user._id, organizationId: organization?.organizationId },
            process.env.JWT_SECRET as string
          ),
        });
      } else {
        res.status(400).send({ error: 'Username or password does not match' });
      }
    } else {
      res.status(400).send({ error: 'Username or password does not match' });
    }
    return;
  } catch (err: any) {
    res.status(400).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.get('/me', verifyToken, async (req: Request, res: Response) => {
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
        $project: {
          _id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          role: '$role',
          organizationId: '$organization._id',
          organization: '$organization.name',
        },
      },
    ]);

    res.status(200).send(user[0]);
    return;
  } catch (err: any) {
    res.status(400).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
