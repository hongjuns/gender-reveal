import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { StepOneForm } from './StepOneForm';
import { useGenderRevealStore } from '@/stores/genderRevealStore';

function resetStore() {
  useGenderRevealStore.setState(
    { step: 'input', input: null, touchCount: 0, isBursting: false },
    false,
  );
}

const meta: Meta<typeof StepOneForm> = {
  title: 'GenderReveal/StepOneForm',
  component: StepOneForm,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof StepOneForm>;

export const EmptyForm: Story = {
  name: '빈 폼',
  play: async () => {
    resetStore();
  },
};

export const FilledForm: Story = {
  name: '채워진 폼',
  play: async ({ canvasElement }) => {
    resetStore();
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.type(canvas.getByLabelText('아기 태명'), '콩이');
    fireEvent.change(canvas.getByLabelText('출산 예정일'), {
      target: { value: '2026-12-25' },
    });
    await user.type(canvas.getByLabelText('받는 사람'), '지민');
    await user.click(canvas.getByLabelText('아들'));
  },
};

export const ValidationError: Story = {
  name: '검증 에러',
  play: async ({ canvasElement }) => {
    resetStore();
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: '젠더리빌 풍선 만들기' }));

    await expect(canvas.getByText('정보를 모두 입력해주세요')).toBeInTheDocument();
  },
};
