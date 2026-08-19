import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSuccessView } from './CommentSuccessView';

describe('CommentSuccessView', () => {
  it('태명과 보낸 사람 이름이 반영된 안내 문구를 렌더링한다', () => {
    render(<CommentSuccessView babyNickname="콩이" senderName="지민" isSon onViewComments={jest.fn()} />);

    expect(screen.getByText(/콩이가 지민님의/)).toBeInTheDocument();
    expect(screen.getByText(/마음을 받았어요💗/)).toBeInTheDocument();
    expect(screen.queryByText(/따뜻한 마음을/)).not.toBeInTheDocument();
  });

  it('덕담 보러가기 클릭 시 onViewComments를 호출한다', async () => {
    const onViewComments = jest.fn();
    const user = userEvent.setup();
    render(<CommentSuccessView babyNickname="콩이" senderName="지민" isSon onViewComments={onViewComments} />);

    await user.click(screen.getByRole('button', { name: '덕담 보러가기' }));

    expect(onViewComments).toHaveBeenCalledTimes(1);
  });

  it('아들이면 comment-success-baby.png를 사용한다', () => {
    render(<CommentSuccessView babyNickname="콩이" senderName="지민" isSon onViewComments={jest.fn()} />);

    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      expect.stringContaining('comment-success-baby.png'),
    );
  });

  it('딸이면 comment-success-baby2.png를 사용한다', () => {
    render(<CommentSuccessView babyNickname="콩이" senderName="지민" isSon={false} onViewComments={jest.fn()} />);

    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      expect.stringContaining('comment-success-baby2.png'),
    );
  });
});
