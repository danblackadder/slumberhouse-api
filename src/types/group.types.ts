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
