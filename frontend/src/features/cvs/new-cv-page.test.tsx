import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';
import { signIn } from '@/test/seed';

describe('NewCvPage', () => {
  it('requires a target role and a background', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/cvs/new');

    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(screen.getByText('Enter the role you’re applying for.')).toBeInTheDocument();
    expect(
      screen.getByText('Describe your background or attach your current CV as a PDF.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Target role')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the background error once text is provided', async () => {
    const user = userEvent.setup();
    signIn();
    renderApp('/cvs/new');

    await user.type(screen.getByLabelText('Your background'), 'Eight years of backend work.');
    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(screen.getByText('Enter the role you’re applying for.')).toBeInTheDocument();
    expect(
      screen.queryByText('Describe your background or attach your current CV as a PDF.'),
    ).not.toBeInTheDocument();
  });
});
