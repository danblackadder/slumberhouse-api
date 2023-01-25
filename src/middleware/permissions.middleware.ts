import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getToken } from '../utility';
import { OrganizationUsers, User } from '../models';
import { OrganizationRole } from '../types';

const unauthorized = (res: Response) => {
  res.status(401).send({ error: 'Unauthorized request' });
  return;
};

export const permissions = {
  organizationAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.body.token;

      console.log(organizationId, userId);
      const organizationUser = await OrganizationUsers.findOne({ organizationId, userId });

      console.log(organizationUser);

      if (
        organizationUser?.role !== OrganizationRole.OWNER &&
        organizationUser?.role !== OrganizationRole.ADMIN
      ) {
        unauthorized(res);
        return;
      }

      next();
    } catch (err) {
      res.status(401).send({ error: 'Invalid token' });
    }
  },

  organizationOwner: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.body.token;

      const organizationUser = await OrganizationUsers.findOne({ organizationId, userId });

      if (organizationUser?.role !== OrganizationRole.OWNER) {
        unauthorized(res);
        return;
      }

      next();
    } catch (err) {
      res.status(401).send({ error: 'Invalid token' });
    }
  },
};
