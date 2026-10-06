import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api-client';
import { makeContent, makeCv, makeGeneratingCv, makeQuestions, makeUser } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { answerQuestion, getCv, retryCv, updateCv } from './cvs-api';

vi.mock('./cvs-api');

describe('CvPage', () => {
  beforeEach(() => {
    vi.mocked(updateCv).mockImplementation(async () => makeCv());
  });

  it('shows the generation stages while the job is running', async () => {
    vi.mocked(getCv).mockResolvedValue(makeGeneratingCv('analyzing'));
    renderApp('/cvs/cv-1', makeUser());

    expect(
      await screen.findByRole('heading', { name: 'Tailoring your CV for Senior Backend Engineer' }),
    ).toBeInTheDocument();
    const progress = screen.getByRole('list', { name: 'Progress' });
    expect(within(progress).getAllByRole('listitem')).toHaveLength(5);
    expect(within(progress).getByText('Analyzing the target role').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('opens the editor once the CV is ready', async () => {
    vi.mocked(getCv).mockResolvedValue(makeCv());
    renderApp('/cvs/cv-1', makeUser());

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
    vi.mocked(getCv).mockResolvedValue(makeCv());
    const content = makeContent();
    content.contact.phone = '+49 151 2345 6789';
    vi.mocked(answerQuestion).mockResolvedValue({
      cv: makeCv({
        content,
        questions: makeQuestions().map((question) =>
          question.id === 'q-phone'
            ? { ...question, status: 'answered', answer: '+49 151 2345 6789' }
            : question,
        ),
      }),
      changed: { section: 'contact', field: 'phone' },
    });
    renderApp('/cvs/cv-1', makeUser());

    const answer = await screen.findByLabelText('What phone number should recruiters use?');
    await user.type(answer, '+49 151 2345 6789');
    await user.click(screen.getAllByRole('button', { name: 'Apply' })[0]);

    expect(
      await screen.findByRole('heading', { name: '4 details would make this stronger' }),
    ).toBeInTheDocument();
    expect(answerQuestion).toHaveBeenCalledWith('cv-1', 'q-phone', '+49 151 2345 6789');
    expect(screen.getByLabelText('Phone')).toHaveValue('+49 151 2345 6789');
    expect(screen.queryByLabelText('What phone number should recruiters use?')).toBeNull();
  });

  it('shows why generation failed and retries it', async () => {
    const user = userEvent.setup();
    vi.mocked(getCv)
      .mockResolvedValueOnce(
        makeCv({
          status: 'failed',
          error: 'AI generation is not configured.',
          content: null,
          questions: [],
        }),
      )
      .mockResolvedValue(makeGeneratingCv());
    vi.mocked(retryCv).mockResolvedValue(makeGeneratingCv());
    renderApp('/cvs/cv-1', makeUser());

    expect(await screen.findByText('AI generation is not configured.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retryCv).toHaveBeenCalledWith('cv-1');
    expect(
      await screen.findByRole('heading', { name: 'Tailoring your CV for Senior Backend Engineer' }),
    ).toBeInTheDocument();
  });

  it('shows not found for a CV the API hides', async () => {
    vi.mocked(getCv).mockRejectedValue(new ApiError(404, 'CV not found.'));
    renderApp('/cvs/cv-1', makeUser());

    expect(await screen.findByRole('heading', { name: 'CV not found' })).toBeInTheDocument();
  });
});
