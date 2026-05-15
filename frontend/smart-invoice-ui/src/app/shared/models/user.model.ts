export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
