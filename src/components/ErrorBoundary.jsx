import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('App render error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-center">
          <div className="detail-card" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ marginTop: 0 }}>Something Went Wrong</h1>
            <p style={{ color: 'var(--text-soft)' }}>
              Here hit an unexpected error. Close and reopen the app, then try again.
            </p>
            <button className="primary-button" onClick={() => window.location.reload()}>
              Reload Here
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
