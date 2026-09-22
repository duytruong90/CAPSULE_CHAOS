import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { GamePage } from '../pages/GamePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SetupPage } from '../pages/SetupPage';

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
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const appRouter = createBrowserRouter(appRoutes);
