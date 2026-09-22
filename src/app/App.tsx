import type { RouterProviderProps } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from './AppErrorBoundary';
import { AppStateProvider } from './AppStateProvider';
import { appRouter } from './routes';

interface AppProps {
  router?: RouterProviderProps['router'];
}

export function App({ router = appRouter }: AppProps) {
  return (
    <AppErrorBoundary>
      <AppStateProvider>
        <RouterProvider router={router} />
      </AppStateProvider>
    </AppErrorBoundary>
  );
}
