import { render } from '@testing-library/react';
import { HeartParticles } from './HeartParticles';

describe('HeartParticles', () => {
  it('하트 6개를 렌더링하고 핑크/블루가 섞여 배치된다', () => {
    const { container } = render(<HeartParticles />);
    const hearts = container.querySelectorAll('svg');

    expect(hearts).toHaveLength(6);

    const pinkCount = container.querySelectorAll('svg.fill-heart-pink').length;
    const blueCount = container.querySelectorAll('svg.fill-heart-blue').length;

    expect(pinkCount).toBe(3);
    expect(blueCount).toBe(3);
  });

  it('장식 요소이므로 스크린리더에서 숨겨진다', () => {
    const { container } = render(<HeartParticles />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
