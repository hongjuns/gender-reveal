import { render, screen } from '@testing-library/react';
import { PRODUCT_PROMO_URL, ProductPromoBanner } from './ProductPromoBanner';

describe('ProductPromoBanner', () => {
  it('태명이 들어간 문구를 보여주고 상품 페이지를 새 창으로 연다', () => {
    render(<ProductPromoBanner babyNickname="콩이" />);

    const link = screen.getByRole('link', { name: /콩이만의 특별한 보조배터리 만들기/ });
    expect(link).toHaveAttribute('href', PRODUCT_PROMO_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('닫기 버튼이 없다', () => {
    render(<ProductPromoBanner babyNickname="콩이" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
