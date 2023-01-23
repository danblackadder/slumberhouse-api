import 'dotenv/config';
import jwt from 'jsonwebtoken';
import e, { Request, Response, NextFunction } from 'express';
import { getToken } from '../utility';
import { User } from '../models';

export interface Token {
  id: string;
  iat: number | undefined;
}

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
    await User.findById(decoded.id);

    req.body['token'] = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
};
