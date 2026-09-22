import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { appRoutes } from '../../app/routes';

function renderSetup() {
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/setup'] });
  return render(<App router={router} />);
}

const eightEntries = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

describe('setup page', () => {
  it('uses the approved setup defaults and blocks Start initially', () => {
    renderSetup();

    expect(screen.getByRole('radio', { name: 'Normal' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Standard' })).toBeChecked();
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
      target: { value: eightEntries.join('\n') },
    });

    expect(screen.getByText('valid entries').previousElementSibling).toHaveTextContent('8');
    expect(screen.getByRole('button', { name: /start giveaway/i })).toBeEnabled();
    expect(screen.getByText(/fewer than 20 entries will be shorter/i)).toBeInTheDocument();
  });

  it('blocks duplicates until the host explicitly allows them', async () => {
    const user = userEvent.setup();
    renderSetup();
    const entries = [...eightEntries.slice(0, 7), 'Alpha'];

    await user.type(screen.getByLabelText(/giveaway name/i), 'Duplicate test');
    fireEvent.change(screen.getByLabelText(/^entries$/i), {
      target: { value: entries.join('\n') },
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
    await user.click(screen.getByRole('radio', { name: 'High' }));
    await user.click(screen.getByRole('checkbox', { name: /^sound/i }));
    await user.click(screen.getByRole('checkbox', { name: /^auto advance/i }));
    await user.click(screen.getByRole('checkbox', { name: /^survivor board/i }));

    expect(screen.getByRole('radio', { name: 'Fast' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'High' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^sound/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^auto advance/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^survivor board/i })).not.toBeChecked();
  });
});
