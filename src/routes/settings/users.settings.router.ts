import express, { Request, Response } from 'express';

import { OrganizationUsers, User } from '../../models';
import { OrganizationRole } from '../../types/roles.types';
import { IGetSettingsUserFilter, IGetSettingsUserSort } from '../../types/settings.types';
import { UserStatus } from '../../types/user.types';
import { userSettingAggregate } from '../../utility/aggregates/settings/user.settings.aggregates';
import { userPostValidation, userPutValidation } from '../../utility/validation/user.validation';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const limit = Number(req.query.limit) || 10;
    const currentPage = Number(req.query.page) || 1;
    const sort = {
      name: Number(req.query.sortName) || 0,
      email: Number(req.query.sortEmail) || 0,
      role: Number(req.query.sortRole) || 0,
      status: Number(req.query.sortStatus) || 0,
    } as IGetSettingsUserSort;
    const filter = {
      nameEmail: req.query.filterNameEmail,
      role: req.query.filterRole,
      status: req.query.filterStatus,
    } as IGetSettingsUserFilter;

    const aggregate = await OrganizationUsers.aggregate(
      await userSettingAggregate({ userId: token.userId, sort, filter, limit, currentPage })
    );

    const totalAggregate = await OrganizationUsers.aggregate(
      await userSettingAggregate({ userId: token.userId, sort, filter, count: true })
    );

    let totalDocuments = 0;
    if (totalAggregate[0]?.totalDocuments > 0) {
      totalDocuments = totalAggregate[0].totalDocuments;
    }

    res.status(200).send({
      users: aggregate,
      pagination: {
        totalDocuments: totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit),
        currentPage,
        limit,
      },
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
    const { errors, email } = await userPostValidation({
      email: req.body.email,
    });

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
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
  } catch (err: unknown) {
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

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
      res.status(400).send({ errors });
      return;
    }

    if (role === OrganizationRole.OWNER) {
      await OrganizationUsers.findOneAndUpdate({ userId: token.userId }, { role: OrganizationRole.ADMIN });
    }

    await OrganizationUsers.findOneAndUpdate({ userId }, { role });

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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    await OrganizationUsers.findOneAndDelete({ userId });
    await User.findByIdAndDelete(userId);

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
