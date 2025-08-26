export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  name: string;
  profileCodes?: string[];
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  name: string;
  enabled: boolean;
  profileCodes?: string[];
}