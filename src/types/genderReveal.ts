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
