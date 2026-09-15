export interface FriendProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface PendingFriendRequest {
  requestId: number;
  requesterId: number;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}