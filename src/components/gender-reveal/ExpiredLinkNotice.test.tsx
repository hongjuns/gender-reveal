import { render, screen } from '@testing-library/react';
import { ExpiredLinkNotice } from './ExpiredLinkNotice';

describe('ExpiredLinkNotice', () => {
  it('만료 안내 문구를 노출한다', () => {
    render(<ExpiredLinkNotice />);

    expect(screen.getByText('링크가 만료되었어요')).toBeInTheDocument();
    expect(screen.getByText(/7일이 지나/)).toBeInTheDocument();
  });

  it('관리자에게 문의하기 링크가 새 창으로 열린다', () => {
    render(<ExpiredLinkNotice />);

    const link = screen.getByRole('link', { name: '관리자에게 문의하기' });
    expect(link).toHaveAttribute('href', 'https://blog.naver.com/hyundgn/224365769203');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
