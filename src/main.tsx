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

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, background: '#090d16', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginBottom: 8, textTransform: 'uppercase' }}>Càn Khôn Trầm Mê - Đạo Phủ Phát Sinh Sự Cố</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 450, marginBottom: 20 }}>
            Dữ liệu tu hành trong bộ nhớ tạm gặp sự cố bất thường ({this.state.error?.message}). Đạo hữu có thể xóa bộ nhớ tạm để khôi phục ứng dụng.
          </p>
          <button
            onClick={this.handleReset}
            style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', fontWeight: 800, border: '2px solid #000', borderRadius: 8, cursor: 'pointer' }}
          >
            🔄 KHÔI PHỤC VÀ TẢI LẠI TRANG
          </button>
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
