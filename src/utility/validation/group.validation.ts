import { UploadedFile } from 'express-fileupload';
import validator from 'validator';

import { Group, GroupUsers, User } from '../../models';
import { IGroupPostErrors, IGroupPutErrors, IGroupUserPutErrors } from '../../types/group.types';
import { GroupRole } from '../../types/roles.types';

export const groupPostValidation = async ({
  name,
  description,
  image,
  users,
}: {
  name?: string;
  description?: string;
  image?: UploadedFile;
  users?: { userId: string; role: GroupRole }[];
}) => {
  const errors = {
    name: [],
    image: [],
    users: [],
  } as IGroupPostErrors;

  if (!name) {
    errors.name.push('Name must be supplied');
  } else {
    if (!validator.isLength(name, { min: 2 })) {
      errors.name.push('Name must be longer than 2 characters');
    }

    name = name.toLowerCase();
  }

  if (image) {
    if (Array.isArray(image)) {
      errors.image.push('Only 1 image can be uploaded');
    }
  }

  if (users) {
    for (const user of users) {
      const found = User.findById(user.userId);
      if (!found) {
        errors.users.push(`${user.userId} is not a valid user`);
      }
    }
  }

  return {
    errors,
    name,
    description,
    image,
    users,
  };
};

export const groupPutValidation = async ({
  name,
  description,
  image,
  widgets,
  groupId,
}: {
  name?: string;
  description?: string;
  image?: UploadedFile;
  widgets?: string[];
  groupId?: string;
}) => {
  const errors = {
    name: [],
    image: [],
    users: [],
    groupId: [],
  } as IGroupPutErrors;

  if (!name) {
    errors.name.push('Name must be supplied');
  } else {
    if (!validator.isLength(name, { min: 2 })) {
      errors.name.push('Name must be longer than 2 characters');
    }

    name = name.toLowerCase();
  }

  if (image) {
    if (Array.isArray(image)) {
      errors.image.push('Only 1 image can be uploaded');
    }
  }

  const group = await Group.findById(groupId);
  if (!group) {
    errors.groupId.push('Group does not exist');
  }

  return {
    errors,
    name,
    description,
    image,
    widgets,
    groupId,
  };
};

export const groupUserPutValidation = async ({
  role,
  userId,
  groupId,
}: {
  role: GroupRole;
  userId: string;
  groupId: string;
}) => {
  const errors = {
    role: [],
    group: [],
  } as IGroupUserPutErrors;

  if (!role) {
    errors.role.push('Role must be provided');
  }

  if (!(await GroupUsers.findOne({ userId, groupId }))) {
    errors.group.push('User does not belong to group');
  }

  return {
    errors,
    role,
  };
};
