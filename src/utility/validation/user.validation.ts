import { OrganizationUsers, User } from '../../models';
import { Token } from '../../types/authentication.types';
import { OrganizationRole } from '../../types/roles.types';
import { IUserPostErrors, IUserPutErrors } from '../../types/user.types';

import validator from 'validator';

export const userPostValidation = async ({ email }: { email?: string }) => {
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

export const userPutValidation = async ({
  userId,
  role,
  token,
}: {
  userId: string;
  role?: OrganizationRole;
  token: Token;
}) => {
  const errors = {
    userId: [],
    role: [],
  } as IUserPutErrors;

  if (!role) {
    errors.role.push('Role must be supplied');
  }

  const user = await User.findById(userId);
  if (!user) {
    errors.userId.push('User does not exist');
  } else {
    const requestUser = await OrganizationUsers.findOne({ userId: token.userId });
    const updateUser = await OrganizationUsers.findOne({ userId });
    if (requestUser?.role === OrganizationRole.ADMIN && updateUser?.role === OrganizationRole.OWNER) {
      errors.userId.push('ADMIN can not modify role of OWNER');
    }
  }

  return {
    errors,
    userId,
    role,
  };
};
