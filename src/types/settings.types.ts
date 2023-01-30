export interface IGetSettingsUserSort {
  name: number;
  email: number;
  role: number;
  status: number;
}

export interface IGetSettingsUserFilter {
  nameEmail: string;
  role: string;
  status: string;
}

export interface IGetSettingsGroupSort {
  name: number;
  users: number;
}

export interface IGetSettingsGroupFilter {
  name: string;
}
