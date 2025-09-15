import { UserRole } from '../types/auth.types';

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  timestamp: Date;
}

export interface UserLoginEvent {
  userId: string;
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserLogoutEvent {
  userId: string;
  timestamp: Date;
}

export interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  resetToken: string;
  timestamp: Date;
}

export interface PasswordResetCompletedEvent {
  userId: string;
  timestamp: Date;
}

export interface EmailVerificationRequestedEvent {
  userId: string;
  email: string;
  verificationToken: string;
  timestamp: Date;
}

export interface EmailVerifiedEvent {
  userId: string;
  email: string;
  timestamp: Date;
} 