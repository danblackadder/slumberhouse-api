import { Request } from 'express';

export const getToken = (req: Request) => {
  return req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
};

export const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export const randomNumber = (number: number) => {
  return Math.floor(Math.random() * number) + 1;
};
