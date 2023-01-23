import validator from 'validator';
import { User } from '../../models';

import { IUserPostErrors } from '../../types';

export const userValidation = async ({ email }: { email?: string }) => {
  const errors = {
    email: [],
  } as IUserPostErrors;

  if (!email) {
    errors.email.push('Email must be supplied');
  } else {
    if (!validator.isEmail(email)) {
      errors.email.push('Email must be a valid email address');
    }

    email = validator.escape(email);
  }

  if ((await User.find({ email })).length > 0) {
    errors.email.push('Email address is already in use');
  }

  return {
    errors,
    email,
  };
};
