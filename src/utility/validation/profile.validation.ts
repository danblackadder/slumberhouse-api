import { UploadedFile } from 'express-fileupload';
import validator from 'validator';

import { IProfileErrors } from '../../types/profile.types';

export const profilePutValidation = async ({
  firstName,
  lastName,
  email,
  image,
}: {
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: UploadedFile;
}) => {
  const errors = {
    firstName: [],
    lastName: [],
    email: [],
    image: [],
  } as IProfileErrors;

  if (!firstName) {
    errors.firstName.push('First name must be supplied');
  } else {
    if (!validator.isLength(firstName, { min: 2 })) {
      errors.firstName.push('First name must be longer than 2 characters');
    }

    firstName = firstName.toLowerCase();
  }

  if (!lastName) {
    errors.lastName.push('Last name must be supplied');
  } else {
    if (!validator.isLength(lastName, { min: 2 })) {
      errors.lastName.push('Last name must be longer than 2 characters');
    }

    lastName = lastName.toLowerCase();
  }

  if (!email) {
    errors.email.push('Email must be supplied');
  } else {
    if (!validator.isEmail(email)) {
      errors.email.push('Email must be a valid email address');
    }

    email = email.toLowerCase();
  }

  if (image) {
    if (Array.isArray(image)) {
      errors.image.push('Only 1 image can be uploaded');
    }
  }

  return {
    errors,
    firstName,
    lastName,
    email,
    image,
  };
};
