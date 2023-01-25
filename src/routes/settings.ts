import express from 'express';
import UserSettings from './settings/users';

const router = express.Router();

router.use('/users', UserSettings);

export default router;
