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

// 관리 화면 전용(관리 코드로만 조회). 받는 사람용 GenderRevealEventRecord에는 code를 두지 않는다.
export interface ManagedBalloon {
  id: string;
  recipientName: string;
  shareLink: string;
  linkExpiresAt: string;
  isExpired: boolean;
  canExtend: boolean;
}

export interface ManagedBalloonGroup {
  babyNickname: string;
  dueDate: string;
  babyGender: BabyGender;
  balloons: ManagedBalloon[];
}

export type GetManagedGroupResult =
  | { status: 'ok'; group: ManagedBalloonGroup }
  | { status: 'not_found' };

export type DeleteBalloonResult = { status: 'ok' } | { status: 'not_found' };

export type ExtendBalloonResult =
  | { status: 'ok'; balloon: ManagedBalloon }
  | { status: 'already_extended' }
  | { status: 'not_found' };
