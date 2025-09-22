import { User } from "prisma/@generated";

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
}

export interface IRegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}