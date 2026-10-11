import { Component, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="safe-top mx-auto max-w-md p-6 space-y-4" role="alert">
      <h1 className="text-xl font-extrabold">Let’s get your clock back</h1>
      <p>This screen could not open. Reload the app to try again. Reloading does not clear your saved records.</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
    </main>;
    return this.props.children;
  }
}
