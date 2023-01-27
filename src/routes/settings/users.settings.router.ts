import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import { OrganizationUsers, User } from '../../models';
import { OrganizationRole } from '../../types/roles.types';
import { UserStatus } from '../../types/user.types';
import { userPostValidation, userPutValidation } from '../../utility/validation/user.validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const id = new mongoose.Types.ObjectId(token.userId);
    const limit = Number(req.query.limit) || 10;
    const currentPage = Number(req.query.page) || 1;

    const user = await OrganizationUsers.findOne({ userId: id });
    const aggregate = await OrganizationUsers.aggregate([
      { $match: { organizationId: user?.organizationId } },
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
        $project: {
          _id: '$user._id',
          role: '$role',
          status: '$status',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
        },
      },
      { $skip: limit * (currentPage - 1) },
      { $limit: limit },
    ]);

    const totalDocuments = await OrganizationUsers.countDocuments({ organizationId: user?.organizationId });

    res.status(200).send({
      users: aggregate,
      pagination: { totalDocuments, totalPages: Math.ceil(totalDocuments / limit), currentPage, limit },
    });
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
    const { errors, email } = await userPostValidation({
      email: req.body.email,
    });

    if (Object.values(errors).some((value: any) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    const organization = await OrganizationUsers.findOne({ userId: token.userId });
    const user = await User.create({ email });
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

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const { errors, role, userId } = await userPutValidation({
      role: req.body.role,
      userId: req.params.id,
      token,
    });

    if (Object.values(errors).some((value: any) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    if (role === OrganizationRole.OWNER) {
      await OrganizationUsers.findOneAndUpdate({ userId: token.userId }, { role: OrganizationRole.ADMIN });
    }

    await OrganizationUsers.findOneAndUpdate({ userId }, { role });

    res.status(200).send();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).send({ errors: 'User id must be a valid id' });
      return;
    }

    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    await OrganizationUsers.findOneAndDelete({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).send();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).send({ errors: 'User id must be a valid id' });
      return;
    }

    console.log(err);
    res.status(500).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
