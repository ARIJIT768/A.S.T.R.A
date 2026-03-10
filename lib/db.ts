// Mock database - In production, replace with real database
export const mockDB = {
  users: new Map<string, any>(),
  healthData: new Map<string, any[]>(),
  sessions: new Map<string, { userId: string; expiresAt: number }>(),
};
