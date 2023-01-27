import { NextFunction, Request, Response } from 'express';

import 'dotenv/config';

import { User } from '../models';
import { Token } from '../types/authentication.types';
import { getToken } from '../utility';

import jwt from 'jsonwebtoken';

const unauthorized = (res: Response) => {
  res.status(401).send({ error: 'Unauthorized request' });
  return;
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getToken(req);
    if (!token) {
      unauthorized(res);
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as Token;
    await User.findById(decoded.userId);

    req.body['token'] = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
};
