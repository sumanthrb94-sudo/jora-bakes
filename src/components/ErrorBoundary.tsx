import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      try {
        const parsed = JSON.parse(state.error?.message || '');
        if (parsed.error && parsed.operationType) {
          errorMessage = `Permission denied for ${parsed.operationType} on ${parsed.path}.`;
        }
      } catch (e) {}

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-beige)] p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md">
            <h2 className="text-2xl font-bold text-[var(--color-terracotta)] mb-4">Oops!</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[var(--color-chocolate)] text-white px-8 py-3 rounded-2xl font-bold"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
