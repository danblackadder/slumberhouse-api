import { UploadedFile } from 'express-fileupload';
import validator from 'validator';

import { Group } from '../../models';
import { IGroupPostErrors } from '../../types';

export const groupValidation = async ({
  name,
  description,
  image,
}: {
  name?: string;
  description?: string;
  image?: UploadedFile;
}) => {
  const errors = {
    name: [],
    image: [],
  } as IGroupPostErrors;

  if (!name) {
    errors.name.push('Name must be supplied');
  } else {
    if (!validator.isLength(name, { min: 2 })) {
      errors.name.push('Name must be longer than 2 characters');
    }

    name = validator.escape(name);
  }

  if (description) {
    description = validator.escape(description);
  }

  if (image) {
    if (Array.isArray(image)) {
      errors.image.push('Only 1 image can be uploaded');
    }
  }

  return {
    errors,
    name,
    description,
    image,
  };
};
