import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-300 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {this.props.title || "Something went wrong in this panel"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

