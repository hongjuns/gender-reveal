export type AppStep = 'input' | 'interaction' | 'result';

export type BabyGender = 'son' | 'daughter';

export interface GenderRevealInput {
  babyNickname: string;
  dueDate: Date;
  recipientName: string;
  babyGender: BabyGender;
}

export interface BalloonInteractionState {
  touchCount: number;
  isBursting: boolean;
}

export interface GenderRevealEventRecord {
  id: string;
  babyNickname: string;
  dueDate: string;
  recipientName: string;
  babyGender: BabyGender;
  shareLink: string;
  createdAt: string;
  linkExpiresAt: string;
}

export type GetEventResult =
  | { status: 'ok'; event: GenderRevealEventRecord }
  | { status: 'expired' }
  | { status: 'not_found' };

export interface GenderRevealCommentRecord {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export type ListCommentsResult =
  | { status: 'ok'; comments: GenderRevealCommentRecord[] }
  | { status: 'expired' }
  | { status: 'not_found' };

export type CreateCommentResult =
  | { status: 'ok'; comment: GenderRevealCommentRecord }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'invalid'; message: string };
