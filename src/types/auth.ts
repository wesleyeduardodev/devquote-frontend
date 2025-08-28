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
  allowedScreens: string[];
};

export type AuthUser = {
  id?: number;
  username: string;
  email: string;
  name?: string;
  firstName?: string;
  roles: string[];
  permissions: string[];
  allowedScreens: string[];
  token: string;
};

export type UserPermissions = {
  userId: number;
  profiles: Profile[];
  resourcePermissions: Record<string, string[]>;
  fieldPermissions: Record<string, Record<string, FieldPermissionType>>;
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

export type FieldPermissionType = 'READ' | 'EDIT' | 'HIDDEN';
