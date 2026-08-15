import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentInviteView } from './CommentInviteView';

describe('CommentInviteView', () => {
  it('안내 문구와 태명이 반영된 문구를 렌더링한다', () => {
    render(<CommentInviteView babyNickname="콩이" onWriteClick={jest.fn()} />);

    expect(screen.getByText(/아직 도착한/)).toBeInTheDocument();
    expect(screen.getByText(/덕담이 없어요ㅠㅠ/)).toBeInTheDocument();
    expect(screen.getByText(/콩이를 기다리는 마음을/)).toBeInTheDocument();
  });

  it('덕담 남기기 클릭 시 onWriteClick을 호출한다', async () => {
    const onWriteClick = jest.fn();
    const user = userEvent.setup();
    render(<CommentInviteView babyNickname="콩이" onWriteClick={onWriteClick} />);

    await user.click(screen.getByRole('button', { name: '덕담 남기기' }));

    expect(onWriteClick).toHaveBeenCalledTimes(1);
  });
});
