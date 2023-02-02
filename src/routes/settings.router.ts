import express from 'express';

import GroupSettings from './settings/groups.settings.router';
import UserSettings from './settings/users.settings.router';

const router = express.Router();

router.use('/users', UserSettings);
router.use('/groups', GroupSettings);

export default router;
