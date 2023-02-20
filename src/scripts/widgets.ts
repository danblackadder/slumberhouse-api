import { exit } from 'process';

import '../database';

import { Widgets } from '../models';

try {
  (async () => {
    await Widgets.create({ widget: 'task board' });
    await Widgets.create({ widget: 'chat' });

    console.log(`Widgets added`);
    exit();
  })();
} catch (err: unknown) {
  console.log(err);
}
