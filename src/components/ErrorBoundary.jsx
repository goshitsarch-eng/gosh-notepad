import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Notepad error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="window" style={{ margin: 40 }}>
          <div className="title-bar">
            <div className="title-bar-text">Notepad - Error</div>
          </div>
          <div className="window-body" style={{ padding: 16 }}>
            <p>Something went wrong:</p>
            <p style={{ fontFamily: 'monospace', color: '#cc0000' }}>
              {this.state.error?.message}
            </p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
