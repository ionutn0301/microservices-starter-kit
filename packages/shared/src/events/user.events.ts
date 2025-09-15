export interface UserProfileUpdatedEvent {
  userId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

export interface UserDeletedEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface UserPreferencesUpdatedEvent {
  userId: string;
  preferences: Record<string, any>;
  timestamp: Date;
} 