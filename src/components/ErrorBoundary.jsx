import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          padding: '40px',
        }}>
          <div style={{
            maxWidth: '700px',
            textAlign: 'left',
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f87171',
              marginBottom: '32px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
            }}>
              ERROR
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              border: '2px solid #f87171',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#f87171',
                marginBottom: '16px',
                wordBreak: 'break-word',
              }}>
                {this.state.error?.toString()}
              </div>

              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'var(--bg-base)',
                padding: '16px',
                borderRadius: '4px',
                lineHeight: '1.6',
                border: '1px solid var(--border)',
              }}>
                {this.state.errorInfo?.componentStack}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
