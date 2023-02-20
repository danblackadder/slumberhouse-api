import express, { Request, Response } from 'express';

import 'dotenv/config';

import { Widgets } from '../models';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const widgets = await Widgets.find({});

    res.status(200).send(widgets);
    return;
  } catch (err: unknown) {
    res.status(400).send({ errors: 'an unknown error occured' });
    return;
  }
});

export default router;
