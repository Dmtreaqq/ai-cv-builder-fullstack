import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/test/render-app';
import { seedCv, signIn } from '@/test/seed';

describe('CvPage', () => {
  it('shows the generation stages while the job is running', async () => {
    const owner = signIn();
    seedCv(owner.id, { generationStartedAt: new Date().toISOString() });
    renderApp('/cvs/cv-1');

    expect(
      await screen.findByRole('heading', { name: 'Tailoring your CV for Senior Backend Engineer' }),
    ).toBeInTheDocument();
    const progress = screen.getByRole('list', { name: 'Progress' });
    expect(within(progress).getAllByRole('listitem')).toHaveLength(5);
    expect(within(progress).getByText('Reading your background').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('opens the editor once the job has finished', async () => {
    const owner = signIn();
    seedCv(owner.id);
    renderApp('/cvs/cv-1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Senior Backend Engineer CV' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Jordan Lee');
    expect(
      screen.getByRole('heading', { name: '5 details would make this stronger' }),
    ).toBeVisible();
  });

  it('applies an answer to the targeted field', async () => {
    const user = userEvent.setup();
    const owner = signIn();
    seedCv(owner.id);
    renderApp('/cvs/cv-1');

    const answer = await screen.findByLabelText('What phone number should recruiters use?');
    await user.type(answer, '+49 151 2345 6789');
    await user.click(screen.getAllByRole('button', { name: 'Apply' })[0]);

    expect(
      await screen.findByRole('heading', { name: '4 details would make this stronger' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toHaveValue('+49 151 2345 6789');
    expect(screen.queryByLabelText('What phone number should recruiters use?')).toBeNull();
  });

  it('hides another user’s CV', async () => {
    seedCv('someone-else');
    signIn();
    renderApp('/cvs/cv-1');

    expect(await screen.findByRole('heading', { name: 'CV not found' })).toBeInTheDocument();
  });
});
