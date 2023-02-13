export interface IGroupMessagePostErrors {
  message: string[];
}

export interface IMessageUser {
  _id: string;
  firstName: string;
  lastName: string;
  image: string;
}
export interface IMessage {
  message: string;
  user: IMessageUser;
}

export interface IEventSourceTask {
  body: IMessage[];
  error?: unknown;
}
