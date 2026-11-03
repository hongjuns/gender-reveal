import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipientListForm } from './RecipientListForm';
import { MAX_RECIPIENTS } from '@/lib/recipients';

function renderForm(props: Partial<React.ComponentProps<typeof RecipientListForm>> = {}) {
  const onBack = jest.fn();
  const onSubmit = jest.fn();
  render(<RecipientListForm onBack={onBack} onSubmit={onSubmit} {...props} />);
  return { onBack, onSubmit };
}

describe('RecipientListForm', () => {
  it('처음에는 받는 사람 01 한 칸만 있고 삭제 버튼이 없다', () => {
    renderForm();

    expect(screen.getByLabelText('받는 사람 01')).toBeInTheDocument();
    expect(screen.queryByLabelText('받는 사람 02')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();
  });

  it('+ 버튼으로 다음 번호 칸을 추가하고, 추가된 칸에는 삭제 버튼이 있다', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: '받는 사람 추가' }));

    expect(screen.getByLabelText('받는 사람 02')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '받는 사람 02 삭제' })).toBeInTheDocument();
  });

  it(`${MAX_RECIPIENTS}칸이 되면 + 버튼이 비활성화된다`, async () => {
    const user = userEvent.setup();
    renderForm();

    const addButton = screen.getByRole('button', { name: '받는 사람 추가' });
    for (let i = 1; i < MAX_RECIPIENTS; i += 1) {
      await user.click(addButton);
    }

    expect(screen.getByLabelText(`받는 사람 ${MAX_RECIPIENTS}`)).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it('중간 칸을 삭제하면 번호가 다시 매겨지고 나머지 입력값은 유지된다', async () => {
    const user = userEvent.setup();
    renderForm({ initialNames: ['할머니', '삼촌', '이모'] });

    await user.click(screen.getByRole('button', { name: '받는 사람 02 삭제' }));

    expect(screen.getByLabelText('받는 사람 01')).toHaveValue('할머니');
    expect(screen.getByLabelText('받는 사람 02')).toHaveValue('이모');
    expect(screen.queryByLabelText('받는 사람 03')).not.toBeInTheDocument();
  });

  it('빈 칸이 있으면 제출하지 않고 오류를 보여준다', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ initialNames: ['할머니', ' '] });

    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('받는 사람을 모두 입력해주세요');
    expect(screen.getByLabelText('받는 사람 02')).toHaveAttribute('aria-invalid', 'true');
  });

  it('모두 입력하면 앞뒤 공백을 제거한 이름 목록으로 제출한다', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ initialNames: [' 할머니 ', '삼촌'] });

    await user.click(screen.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    expect(onSubmit).toHaveBeenCalledWith(['할머니', '삼촌']);
  });

  it('뒤로 가기 버튼은 현재 입력값과 함께 onBack을 호출한다', async () => {
    const user = userEvent.setup();
    const { onBack } = renderForm();

    await user.type(screen.getByLabelText('받는 사람 01'), '할머니');
    await user.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(onBack).toHaveBeenCalledWith(['할머니']);
  });

  it('errorMessage를 받으면 오류 문구를 보여준다', () => {
    renderForm({ errorMessage: '풍선 생성에 실패했어요. 다시 시도해주세요' });

    expect(screen.getByRole('alert')).toHaveTextContent('풍선 생성에 실패했어요. 다시 시도해주세요');
  });
});
