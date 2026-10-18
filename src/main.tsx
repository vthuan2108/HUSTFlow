/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearReset = () => {
    if (confirm('⚠️ Are you sure you want to clear local storage cache to restore the application?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, background: '#FBF8F2', color: '#2C2825', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F5EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2C2825', marginBottom: 8 }}>
            Đã xảy ra lỗi tải trang
          </h2>
          <p style={{ fontSize: 14, color: '#797268', maxWidth: 480, marginBottom: 12, lineHeight: 1.5 }}>
            Hệ thống phát hiện lỗi: <code style={{ background: '#EDE6DB', padding: '2px 6px', borderRadius: 4, color: '#B85D38', fontSize: 13 }}>{this.state.error?.message}</code>
          </p>
          <p style={{ fontSize: 13, color: '#9C948A', maxWidth: 440, marginBottom: 24 }}>
            Vui lòng nhấn Tải lại trang hoặc xóa bộ nhớ tạm để phục hồi trạng thái ổn định.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{ padding: '10px 20px', background: '#2E6930', color: '#FFFFFF', fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, boxShadow: '0 2px 4px rgba(46,105,48,0.2)' }}
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={this.handleClearReset}
              style={{ padding: '10px 20px', background: '#FFFFFF', color: '#797268', fontWeight: 600, border: '1px solid #E7E1D7', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
            >
              🧹 Xóa cache & tải lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
