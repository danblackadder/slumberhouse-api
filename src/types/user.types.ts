export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IUserPostErrors {
  email: string[];
}

export interface IUserPutErrors {
  userId: string[];
  role: string[];
}
