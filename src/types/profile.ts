export interface Profile {
  id: number;
  code: string;
  name: string;
  description: string;
  level: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  allowedOperations?: string[];
  allowedScreens?: string[];
  userCount?: number;
}

export interface CreateProfileRequest {
  code: string;
  name: string;
  description: string;
  level: number;
  active?: boolean;
}

export interface UpdateProfileRequest {
  name: string;
  description: string;
  level: number;
  active: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  enabled: boolean;
  active?: boolean;
  profiles: Profile[];
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignProfileRequest {
  userId: number;
  profileId: number;
  active?: boolean;
}