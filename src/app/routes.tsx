import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { GamePage } from '../pages/GamePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SetupPage } from '../pages/SetupPage';
import { BreakoutFaultlinePreviewPage } from '../pages/BreakoutFaultlinePreviewPage';
import { BreakoutEscapeRunPreviewPage } from '../pages/BreakoutEscapeRunPreviewPage';

const developmentRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/breakout/faultline',
        element: <BreakoutFaultlinePreviewPage />,
      },
      {
        path: '/dev/breakout/escape-run',
        element: <BreakoutEscapeRunPreviewPage />,
      },
    ]
  : [];

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/setup" replace />,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/game',
    element: <GamePage />,
  },
  ...developmentRoutes,
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const appRouter = createBrowserRouter(appRoutes);
