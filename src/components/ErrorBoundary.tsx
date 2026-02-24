import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <div className="mb-6 rounded-full bg-red-100 p-4 text-red-600">
                        <AlertCircle size={48} />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">Oups ! Quelque chose s'est mal passé</h1>
                    <p className="mb-8 max-w-md text-gray-600">
                        Une erreur inattendue est survenue. Nous nous excusons pour ce désagrément.
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={this.handleReset} className="flex items-center gap-2">
                            <RotateCcw size={18} />
                            Recharger l'application
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-gray-900 p-4 text-left text-xs text-white">
                            <pre>{this.state.error.stack}</pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
