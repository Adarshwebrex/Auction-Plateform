import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    
    // Log to service in production
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }
  
  handleRetry = () => {
    const { retryCount } = this.state;
    if (retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };
  
  handleReload = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const canRetry = retryCount < 3;
      
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Oops! Something went wrong</h2>
              <p className="text-white/60">
                {canRetry 
                  ? "We encountered an unexpected error. You can try again or refresh the page."
                  : "Something seems to be broken. Please refresh the page to continue."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Try Again {retryCount > 0 && `(${retryCount}/3)`}
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-6">
                <summary className="cursor-pointer text-white/60 hover:text-white transition-colors">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 p-3 bg-black/30 rounded-lg text-xs font-mono text-red-400 overflow-auto max-h-40">
                  <div className="mb-2">{this.state.error.toString()}</div>
                  <div className="text-white/60">{this.state.errorInfo.componentStack}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
