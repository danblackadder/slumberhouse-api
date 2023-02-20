import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

import 'dotenv/config';

import { Organization, OrganizationUsers, User } from '../models';
import { OrganizationRole } from '../types/roles.types';
import { UserStatus } from '../types/user.types';
import { authValidation } from '../utility/validation/authentication.validation';

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

    if (Object.values(errors).some((value: string[]) => value.length > 0)) {
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
  } catch (err: unknown) {
    res.status(400).send({ error: 'an unknown error occured' });
    return;
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    let { email } = req.body;
    email = validator.escape(email).toLowerCase();
    const user = await User.findOne({ email });
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
  } catch (err: unknown) {
    res.status(400).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
