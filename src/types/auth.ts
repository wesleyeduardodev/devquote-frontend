export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthLoginResponse = {
  token: string;
  type: 'Bearer';
  username: string;
  email: string;
  roles: string[];
};

export type AuthUser = {
  id?: number;
  username: string;
  email: string;
  name?: string;
  firstName?: string;
  roles: string[];
  token: string;
};

export type Profile = {
  id: number;
  code: string;
  name: string;
  description: string;
  level: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
