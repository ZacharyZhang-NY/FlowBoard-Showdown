export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
};

export type AuthenticatedSession = {
  sessionId: string;
  expiresAt: string;
  user: AuthenticatedUser;
};
