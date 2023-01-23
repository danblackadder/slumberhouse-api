import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrganizationUsers, User } from '../models';
import { OrganizationRole, UserStatus } from '../types';
import { userValidation } from '../utility/validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const id = new mongoose.Types.ObjectId(token.id);

    const user = await OrganizationUsers.findOne({ userId: id });
    const users = await OrganizationUsers.aggregate()
      .match({ organizationId: user?.organizationId })
      .lookup({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      })
      .unwind('user')
      .project({
        _id: '$_id',
        role: '$role',
        status: '$status',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
      });

    console.log(users);

    res.status(200).send(users);
    return;
  } catch (err: any) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const { errors, email } = await userValidation({
      email: req.body.email,
    });

    if (Object.values(errors).some((value) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const organization = await OrganizationUsers.findOne({ userId: token.id });
    const user = await User.create({ firstName: '', lastName: '', email });
    await OrganizationUsers.create({
      role: OrganizationRole.BASIC,
      status: UserStatus.INVITED,
      userId: user._id,
      organizationId: organization?.organizationId,
    });

    res.status(200).send();
  } catch (err: any) {
    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
