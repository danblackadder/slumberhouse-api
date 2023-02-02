export interface IGroupPostErrors {
  name: string[];
  image: string[];
  users: string[];
}

export interface IGroupPutErrors {
  name: string[];
  image: string[];
  users: string[];
  groupId: string[];
}

export interface IGroupUserPutErrors {
  role: string[];
  group: string[];
}

export interface IGetGroupUserSort {
  name: number;
  email: number;
  role: number;
}

export interface IGetGroupUserFilter {
  nameEmail: string;
  role: string;
}
