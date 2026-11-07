import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PRODUCT_PROMO_URL, ProductPromoBanner } from './ProductPromoBanner';

describe('ProductPromoBanner', () => {
  it('태명이 들어간 문구를 보여주고 상품 페이지를 새 창으로 연다', () => {
    render(<ProductPromoBanner babyNickname="콩이" />);

    const link = screen.getByRole('link', { name: /콩이만의 특별한 보조배터리 만들기/ });
    expect(link).toHaveAttribute('href', PRODUCT_PROMO_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('X 버튼을 누르면 배너가 닫힌다', async () => {
    const user = userEvent.setup();
    render(<ProductPromoBanner babyNickname="콩이" />);

    await user.click(screen.getByRole('button', { name: '배너 닫기' }));

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
