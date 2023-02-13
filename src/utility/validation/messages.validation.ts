import { IGroupMessagePostErrors } from '../../types/messages.types';

export const groupMessagePostValidation = async ({ message }: { message: string }) => {
  const errors = {
    message: [],
  } as IGroupMessagePostErrors;

  if (!message) {
    errors.message.push('Message must be provided');
  }

  return {
    errors,
    message,
  };
};
