import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Unhandled render error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
                    <div className="max-w-md w-full text-center">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            An unexpected error occurred while rendering this page. Try reloading —
                            if the problem persists, contact your administrator.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
