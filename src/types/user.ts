export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileCodes?: string[];
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  enabled: boolean;
  profileCodes?: string[];
}