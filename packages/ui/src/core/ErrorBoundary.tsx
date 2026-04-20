import React from 'react';

interface Props {
    label: string;
    children: React.ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Isolates render errors from a single page or overlay so a crash in one
 * module's UI doesn't blank the entire NUI layer. Logs the error once and
 * renders nothing while the boundary is tripped.
 *
 * Resetting the boundary requires remounting (e.g. by hot-reload). That's
 * fine for a dev-focused hard failure — prod errors should never reach here
 * if modules test their components.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error(
            `[merinaa:error-boundary] ${this.props.label} crashed:`,
            error,
            info.componentStack,
        );
    }

    render(): React.ReactNode {
        if (this.state.error) return null;
        return this.props.children;
    }
}
