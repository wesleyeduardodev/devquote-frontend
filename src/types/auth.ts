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
  permissions: string[];
};

export type AuthUser = {
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  token: string;
};
