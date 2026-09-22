import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Capsule Chaos encountered an unrecoverable render error.', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <p className="eyebrow">System interruption</p>
          <h1>The stage could not be loaded.</h1>
          <p>Reload the application to return to the setup screen.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload Capsule Chaos
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
