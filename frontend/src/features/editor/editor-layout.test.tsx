import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getCv } from '@/features/cvs/cvs-api';
import { makeCv, makeUser } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';

vi.mock('@/features/cvs/cvs-api');

async function openEditor() {
  vi.mocked(getCv).mockResolvedValue(makeCv());
  const view = renderApp('/cvs/cv-1', makeUser());
  await screen.findByRole('heading', { level: 1, name: 'Senior Backend Engineer CV' });
  return view;
}

describe('EditorLayout', () => {
  it('shows the form and the preview side by side by default', async () => {
    await openEditor();

    expect(screen.getByRole('button', { name: 'Side by side' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await screen.findByRole('region', { name: 'CV preview' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'Preview' })).not.toHaveClass('hidden');
  });

  it('switches between the form and the preview in tabs mode', async () => {
    const user = userEvent.setup();
    await openEditor();

    await user.click(screen.getByRole('button', { name: 'Tabs' }));
    const editPanel = screen.getByRole('tabpanel', { name: 'Edit' });
    const previewPanel = screen.getByRole('tabpanel', { name: 'Preview' });
    expect(previewPanel).toHaveClass('hidden');

    await user.click(screen.getByRole('tab', { name: 'Preview' }));

    expect(editPanel).toHaveClass('hidden');
    expect(previewPanel).not.toHaveClass('hidden');
  });

  it('remembers the chosen layout', async () => {
    const user = userEvent.setup();
    const { unmount } = await openEditor();
    await user.click(screen.getByRole('button', { name: 'Tabs' }));
    unmount();

    renderApp('/cvs/cv-1', makeUser());

    expect(await screen.findByRole('button', { name: 'Tabs' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
