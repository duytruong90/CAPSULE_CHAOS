import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { appRoutes } from '../../app/routes';

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(<App router={router} />);
}

describe('application routes', () => {
  it('renders the setup screen at /setup', () => {
    renderRoute('/setup');

    expect(screen.getByRole('main', { name: /setup screen/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /load the names/i })).toBeInTheDocument();
  });

  it('renders the game screen at /game', () => {
    renderRoute('/game');

    expect(screen.getByRole('main', { name: /game screen/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /game stage/i })).toBeInTheDocument();
  });

  it('redirects the root route to setup', async () => {
    renderRoute('/');

    expect(await screen.findByRole('main', { name: /setup screen/i })).toBeInTheDocument();
  });

  it('renders a safe not-found screen for unknown routes', () => {
    renderRoute('/outside-the-machine');

    expect(screen.getByRole('main', { name: /page not found/i })).toBeInTheDocument();
  });
});
