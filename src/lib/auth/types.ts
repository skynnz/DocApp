export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  mustChangePassword: boolean;
};

export type CurrentSession = {
  sessionId: string;
  user: SessionUser;
};
