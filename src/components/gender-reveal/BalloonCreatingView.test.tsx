import { render, screen } from '@testing-library/react';
import { BalloonCreatingView } from './BalloonCreatingView';

describe('BalloonCreatingView', () => {
  it('태명과 함께 풍선을 만드는 중이라는 안내를 보여준다', () => {
    render(<BalloonCreatingView babyNickname="깡총이" />);

    expect(screen.getByText('깡총이의')).toBeInTheDocument();
    expect(screen.getByText('풍선이 만들어지고 있어요.')).toBeInTheDocument();
  });

  it('스크린 리더가 읽을 수 있도록 status 영역으로 노출한다', () => {
    render(<BalloonCreatingView babyNickname="깡총이" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
