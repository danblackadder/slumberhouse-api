import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import 'dotenv/config';

import { GroupUsers, OrganizationUsers } from '../models';
import { GroupRole, OrganizationRole } from '../types/roles.types';

const unauthorized = (res: Response) => {
  res.status(401).send({ error: 'Unauthorized request' });
  return;
};

export const permissions = {
  organizationAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.body.token;

      const organizationUser = await OrganizationUsers.findOne({ organizationId, userId });

      if (organizationUser?.role !== OrganizationRole.OWNER && organizationUser?.role !== OrganizationRole.ADMIN) {
        unauthorized(res);
        return;
      }

      next();
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      res.status(401).send({ error: 'Invalid token' });
    }
  },

  groupAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, userId } = req.body.token;
      const groupId = new mongoose.Types.ObjectId(req.params.id);

      const organizationUser = await OrganizationUsers.findOne({ organizationId, userId });
      const groupUser = await GroupUsers.findOne({ groupId, userId });

      if (
        groupUser?.role !== GroupRole.ADMIN &&
        organizationUser?.role !== OrganizationRole.OWNER &&
        organizationUser?.role !== OrganizationRole.ADMIN
      ) {
        unauthorized(res);
        return;
      }

      next();
    } catch (err: unknown) {
      res.status(401).send({ error: 'Invalid token' });
    }
  },

  groupUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body.token;
      const groupId = new mongoose.Types.ObjectId(req.params.groupId);

      const groupUser = await GroupUsers.findOne({ groupId, userId });

      if (!groupUser) {
        unauthorized(res);
        return;
      }

      next();
    } catch (err: unknown) {
      res.status(401).send({ error: 'Invalid token' });
    }
  },
};
