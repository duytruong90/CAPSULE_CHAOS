import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { appRoutes } from '../../app/routes';
import { LEGACY_SESSION_STORAGE_KEY } from '../../game/breakout/persistence';

function renderSetup() {
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/setup'] });
  return render(<App router={router} />);
}

const entries = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

describe('setup page', () => {
  beforeEach(() => localStorage.clear());

  it('uses the approved setup defaults and blocks Start initially', () => {
    renderSetup();

    expect(screen.getByRole('radio', { name: 'Normal' })).toBeChecked();
    expect(screen.queryByText(/fake-out intensity/i)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^sound/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^auto advance/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^survivor board/i })).toBeChecked();
    expect(screen.getByRole('button', { name: /start giveaway/i })).toBeDisabled();
  });

  it('enables Start for a named roster at the hard minimum', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.type(screen.getByLabelText(/giveaway name/i), 'Autumn Giveaway');
    fireEvent.change(screen.getByLabelText(/^entries$/i), {
      target: { value: 'Alpha' },
    });

    expect(screen.getByText('valid entries').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /start giveaway/i })).toBeEnabled();
    expect(
      screen.getByText('One entry: this run will declare that entry as the winner.'),
    ).toBeInTheDocument();
  });

  it('blocks duplicates until the host explicitly allows them', async () => {
    const user = userEvent.setup();
    renderSetup();
    const duplicateEntries = [...entries.slice(0, 7), 'Alpha'];

    await user.type(screen.getByLabelText(/giveaway name/i), 'Duplicate test');
    fireEvent.change(screen.getByLabelText(/^entries$/i), {
      target: { value: duplicateEntries.join('\n') },
    });

    expect(screen.getByText(/resolve duplicate names/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duplicate names/i)).toHaveTextContent('lines 1, 8');
    expect(screen.getByRole('button', { name: /start giveaway/i })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /allow duplicate entries/i }));

    expect(screen.queryByText(/resolve duplicate names/i)).not.toBeInTheDocument();
    expect(screen.getByText(/duplicate name group is allowed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start giveaway/i })).toBeEnabled();
  });

  it('updates all host-selectable show options', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.click(screen.getByRole('radio', { name: 'Fast' }));
    await user.click(screen.getByRole('checkbox', { name: /^sound/i }));
    await user.click(screen.getByRole('checkbox', { name: /^auto advance/i }));
    await user.click(screen.getByRole('checkbox', { name: /^survivor board/i }));

    expect(screen.getByRole('radio', { name: 'Fast' })).toBeChecked();
    expect(screen.queryByText(/fake-out intensity/i)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^sound/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^auto advance/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^survivor board/i })).not.toBeChecked();
  });

  it('locks and precomputes the complete game before opening the game screen', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.type(screen.getByLabelText(/giveaway name/i), 'Locked UI test');
    fireEvent.change(screen.getByLabelText(/^entries$/i), {
      target: { value: entries.join('\n') },
    });
    await user.click(screen.getByRole('button', { name: /start giveaway/i }));

    expect(await screen.findByRole('heading', { name: /outcome locked/i })).toBeInTheDocument();
    expect(screen.getByText(/capsule chaos · breakout/i)).toBeInTheDocument();
    expect(screen.getByText(/^lock /i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause/i })).toBeEnabled();
  });

  it('detects but never modifies a previous-rules session', async () => {
    const user = userEvent.setup();
    const legacyJson = '{"schemaVersion":"capsule-chaos-session-v1"}';
    localStorage.setItem(LEGACY_SESSION_STORAGE_KEY, legacyJson);

    renderSetup();

    expect(
      screen.getByText('A previous-rules session is saved. This version cannot resume it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download previous session JSON' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Start a new Breakout' }));

    expect(screen.queryByLabelText('Previous-rules session found')).not.toBeInTheDocument();
    expect(localStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBe(legacyJson);
  });
});
