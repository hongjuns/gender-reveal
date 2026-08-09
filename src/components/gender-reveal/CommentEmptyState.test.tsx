import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentEmptyState } from './CommentEmptyState';

describe('CommentEmptyState', () => {
  it('안내 문구와 태명이 반영된 타이틀을 렌더링한다', () => {
    render(<CommentEmptyState babyNickname="콩이" onViewWrite={jest.fn()} />);

    expect(screen.getByText('아직 남겨진 덕담이 없어요')).toBeInTheDocument();
    expect(screen.getByText(/콩이아 세상에/)).toBeInTheDocument();
  });

  it('덕담 남기기 클릭 시 onViewWrite를 호출한다', async () => {
    const onViewWrite = jest.fn();
    const user = userEvent.setup();
    render(<CommentEmptyState babyNickname="콩이" onViewWrite={onViewWrite} />);

    await user.click(screen.getByRole('button', { name: '덕담 남기기' }));

    expect(onViewWrite).toHaveBeenCalledTimes(1);
  });
});
