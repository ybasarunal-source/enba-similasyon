import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.moduleName ?? 'module', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
        <AlertTriangle size={36} className="text-amber-500" />
        <div>
          <p className="font-semibold text-gray-800">
            {this.props.moduleName ? `"${this.props.moduleName}" yüklenemedi` : 'Modül yüklenemedi'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {this.state.error?.message ?? 'Beklenmeyen bir hata oluştu.'}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-enba-orange text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={14} />
          Tekrar dene
        </button>
      </div>
    );
  }
}
