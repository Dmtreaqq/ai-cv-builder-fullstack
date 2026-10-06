import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api-client';
import { makeGeneratingCv, makeUser } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { createCv, getCv } from './cvs-api';

vi.mock('./cvs-api');

describe('NewCvPage', () => {
  it('requires a target role and a background', async () => {
    const user = userEvent.setup();
    renderApp('/cvs/new', makeUser());

    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(screen.getByText('Enter the role you’re applying for.')).toBeInTheDocument();
    expect(
      screen.getByText('Describe your background or attach your current CV as a PDF.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Target role')).toHaveAttribute('aria-invalid', 'true');
    expect(createCv).not.toHaveBeenCalled();
  });

  it('clears the background error once text is provided', async () => {
    const user = userEvent.setup();
    renderApp('/cvs/new', makeUser());

    await user.type(screen.getByLabelText('Your background'), 'Eight years of backend work.');
    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(screen.getByText('Enter the role you’re applying for.')).toBeInTheDocument();
    expect(
      screen.queryByText('Describe your background or attach your current CV as a PDF.'),
    ).not.toBeInTheDocument();
  });

  it('starts generation and opens the progress screen', async () => {
    const user = userEvent.setup();
    vi.mocked(createCv).mockResolvedValue(makeGeneratingCv());
    vi.mocked(getCv).mockResolvedValue(makeGeneratingCv());
    renderApp('/cvs/new', makeUser());

    await user.type(screen.getByLabelText('Your background'), 'Eight years of backend work.');
    await user.type(screen.getByLabelText('Target role'), 'Senior Backend Engineer');
    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(
      await screen.findByRole('heading', { name: 'Tailoring your CV for Senior Backend Engineer' }),
    ).toBeInTheDocument();
    expect(createCv).toHaveBeenCalledWith({
      sourceText: 'Eight years of backend work.',
      targetRole: 'Senior Backend Engineer',
      file: null,
    });
  });

  it('shows the server message when the CV can’t be started', async () => {
    const user = userEvent.setup();
    vi.mocked(createCv).mockRejectedValue(new ApiError(429, 'Too many requests, try again later.'));
    renderApp('/cvs/new', makeUser());

    await user.type(screen.getByLabelText('Your background'), 'Eight years of backend work.');
    await user.type(screen.getByLabelText('Target role'), 'Engineer');
    await user.click(screen.getByRole('button', { name: 'Generate CV' }));

    expect(await screen.findByText('Too many requests, try again later.')).toBeInTheDocument();
  });
});
