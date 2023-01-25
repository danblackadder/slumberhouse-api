export interface IRegistrationErrors {
  firstName: string[];
  lastName: string[];
  email: string[];
  password: string[];
  passwordConfirmation: string[];
  organization: string[];
}

export interface Token {
  userId: string;
  organizationId: string;
  iat: number | undefined;
}
