import { render, screen } from '@testing-library/react';
import { ExpiredLinkNotice } from './ExpiredLinkNotice';

describe('ExpiredLinkNotice', () => {
  it('만료 안내 문구를 노출한다', () => {
    render(<ExpiredLinkNotice />);

    expect(screen.getByText('만료된 링크예요')).toBeInTheDocument();
    expect(screen.getByText(/7일이 지나/)).toBeInTheDocument();
  });
});
