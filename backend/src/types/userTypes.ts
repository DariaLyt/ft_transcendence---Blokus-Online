export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
}

