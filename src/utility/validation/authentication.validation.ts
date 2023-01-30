import validator from 'validator';

import { User } from '../../models';
import { IRegistrationErrors } from '../../types/authentication.types';

export const authValidation = async ({
  firstName,
  lastName,
  email,
  organization,
  password,
  passwordConfirmation,
}: {
  firstName?: string;
  lastName?: string;
  email?: string;
  organization?: string;
  password?: string;
  passwordConfirmation?: string;
}) => {
  const errors = {
    firstName: [],
    lastName: [],
    email: [],
    organization: [],
    password: [],
    passwordConfirmation: [],
  } as IRegistrationErrors;

  if (!firstName) {
    errors.firstName.push('First name must be supplied');
  } else {
    if (!validator.isLength(firstName, { min: 2 })) {
      errors.firstName.push('First name must be longer than 2 characters');
    }

    firstName = validator.escape(firstName).toLowerCase();
  }

  if (!lastName) {
    errors.lastName.push('Last name must be supplied');
  } else {
    if (!validator.isLength(lastName, { min: 2 })) {
      errors.lastName.push('Last name must be longer than 2 characters');
    }

    lastName = validator.escape(lastName).toLowerCase();
  }

  if (!email) {
    errors.email.push('Email must be supplied');
  } else {
    if (!validator.isEmail(email)) {
      errors.email.push('Email must be a valid email address');
    }

    email = validator.escape(email).toLowerCase();
  }

  if (!organization) {
    errors.organization.push('Organization must be supplied');
  } else {
    if (!validator.isLength(organization, { min: 2 })) {
      errors.organization.push('Organization must be longer than 2 characters');
    }

    organization = validator.escape(organization).toLowerCase();
  }

  if (!password) {
    errors.password.push('Password must be supplied');
  } else {
    if (!validator.isLength(password, { min: 8 })) {
      errors.password.push('Password must be longer than 8 characters');
    }

    if (
      !validator.isStrongPassword(password, {
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 0,
        minSymbols: 0,
      })
    ) {
      errors.password.push('Password must contain upper and lower case characters');
    }

    if (
      !validator.isStrongPassword(password, {
        minUppercase: 0,
        minLowercase: 0,
        minNumbers: 1,
        minSymbols: 0,
      })
    ) {
      errors.password.push('Password must contain at least 1 number');
    }
  }

  if (!passwordConfirmation) {
    errors.passwordConfirmation.push('Password confirmation must be supplied');
  }

  if (password && passwordConfirmation && password !== passwordConfirmation) {
    errors.passwordConfirmation.push('Password confirmation must match password');
  }

  if ((await User.find({ email })).length > 0) {
    errors.email.push('Email address is already in use');
  }

  return {
    errors,
    firstName,
    lastName,
    email,
    organization,
    password,
  };
};
