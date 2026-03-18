import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bot, Sparkles, Send, Upload, FileText, X, Trash2, CheckCircle, AlertCircle, Info, Menu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import type { DashboardSpec } from './types';
import './index.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  filename: string;
  rows: number;
  columns: string[];
  session_id: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const API_UPLOAD = `${API_BASE}/api/upload`;
const API_QUERY  = `${API_BASE}/api/query`;

let toastCounter = 0;

function newToastId(): number {
  // Use timestamp + counter for unique, stable IDs
  return Date.now() * 1000 + (++toastCounter % 1000);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Hello! I\'m your BI Analytics Assistant. Upload a CSV file to analyze your own data, or ask a question about the built-in demo dataset.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [currentSpec, setCurrentSpec]   = useState<DashboardSpec | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [loadingStep, setLoadingStep]   = useState<string>('');

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = newToastId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('error', 'Only CSV files are supported.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(API_UPLOAD, formData);
      const data = response.data;
      if (data.status === 'success') {
        setUploadedFile({
          filename: data.filename,
          rows: data.rows,
          columns: data.columns,
          session_id: data.session_id,
        });
        setCurrentSpec(null);
        setMessages([
          {
            role: 'ai',
            content: `Loaded ${data.filename} — ${data.rows.toLocaleString()} rows, ${data.columns.length} columns.\n\nColumns: ${data.columns.join(', ')}\n\nWhat insights would you like to explore?`,
            timestamp: new Date(),
          },
        ]);
        showToast('success', `${data.filename} uploaded successfully.`);
      }
    } catch (error: unknown) {
      const axiosErr = error as import('axios').AxiosError;
      const errMsg = (axiosErr.response?.data as { detail?: string })?.detail || axiosErr.message || 'Upload failed.';
      showToast('error', `Upload failed: ${errMsg}`);
      setMessages(prev => [...prev, { role: 'ai', content: `Upload error: ${errMsg}`, timestamp: new Date() }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const clearUpload = () => {
    setUploadedFile(null);
    setCurrentSpec(null);
    setMessages([
      {
        role: 'ai',
        content: 'File removed. Using the default demo dataset. Upload a CSV to analyze your own data.',
        timestamp: new Date(),
      },
    ]);
    showToast('info', 'Switched back to demo dataset.');
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'ai',
        content: uploadedFile
          ? `Chat cleared. I still have ${uploadedFile.filename} loaded. What would you like to explore?`
          : 'Chat cleared. Ask anything about the demo dataset or upload your own CSV.',
        timestamp: new Date(),
      },
    ]);
    setCurrentSpec(null);
    showToast('info', 'Chat history cleared.');
  };

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    const newMsg: Message = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);
    setLoadingStep('Analyzing your question...');

    try {
      setTimeout(() => setLoadingStep('Generating dashboard...'), 800);

      const response = await axios.post(API_QUERY, {
        query,
        session_id: uploadedFile?.session_id ?? null,
      });
      const data = response.data;

      if (data.status === 'success') {
        setLoadingStep('Rendering visualizations...');
        setTimeout(() => {
          setCurrentSpec(data.data);
          setMessages(prev => [
            ...prev,
            {
              role: 'ai',
              content: 'Here is your dashboard. You can click any suggestion below to refine it.',
              timestamp: new Date(),
            },
          ]);
          setLoadingStep('');
          closeSidebar();
        }, 300);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: 'Unexpected response format from the server.', timestamp: new Date() },
        ]);
        setLoadingStep('');
      }
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as import('axios').AxiosError;
      const errMsg =
        (axiosErr.response?.data as { detail?: string })?.detail ||
        axiosErr.message ||
        'Unknown error occurred.';
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `Sorry, I encountered an error: ${errMsg}`, timestamp: new Date() },
      ]);
      showToast('error', `Query failed: ${errMsg}`);
      setLoadingStep('');
    } finally {
      setIsLoading(false);
    }
  };

  const toastIcon = (type: Toast['type']) => {
    if (type === 'success') return <CheckCircle size={16} className="toast-icon-success" />;
    if (type === 'error')   return <AlertCircle size={16} className="toast-icon-error" />;
    return <Info size={16} className="toast-icon-info" />;
  };

  return (
    <>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {toastIcon(t.type)}
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Mobile sidebar toggle */}
      <button
        className={`sidebar-toggle${sidebarOpen ? ' active' : ''}`}
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div className="app-container">
        {/* Sidebar */}
        <div className={`glass-panel sidebar${sidebarOpen ? ' open' : ''}`}>
          {/* Header */}
          <div className="sidebar-header">
            <div className="app-title">
              <div className="app-title-icon">
                <Sparkles size={16} color="#fff" />
              </div>
              <span>Instant BI</span>
            </div>
            <div className="header-actions">
              <button
                className="icon-btn danger"
                onClick={clearChat}
                title="Clear chat history"
                disabled={messages.length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Upload zone / file info */}
          {uploadedFile ? (
            <div className="file-info-bar">
              <FileText size={15} color="var(--accent)" />
              <span className="file-info-name" title={uploadedFile.filename}>{uploadedFile.filename}</span>
              <span className="file-info-meta">{uploadedFile.rows.toLocaleString()} rows</span>
              <button className="file-clear-btn" onClick={clearUpload} title="Remove file">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div
              className={`upload-zone${isUploading ? ' uploading' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {isUploading ? (
                <span className="upload-zone-text">Uploading…</span>
              ) : (
                <>
                  <Upload size={16} color="var(--accent)" />
                  <span className="upload-zone-text">Drop CSV here or <u>browse</u></span>
                </>
              )}
            </div>
          )}

          {/* Chat history */}
          <div className="chat-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
                <span className="chat-message-meta">{formatTime(msg.timestamp)}</span>
              </div>
            ))}
            {isLoading && (
              <>
                {loadingStep && (
                  <div className="loading-progress">
                    <div className="loading-spinner" />
                    <span>{loadingStep}</span>
                  </div>
                )}
                <div className="chat-message ai">
                  <div className="chat-bubble ai loader">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              </>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Follow-up suggestions */}
          {currentSpec?.follow_up_suggestions && currentSpec.follow_up_suggestions.length > 0 && (
            <div className="suggestions-container">
              <span className="suggestions-label">Suggestions</span>
              {currentSpec.follow_up_suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="suggestion-pill"
                  onClick={() => handleSend(sug)}
                >
                  <Sparkles size={10} />
                  {sug}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="chat-input-wrapper">
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
                placeholder={uploadedFile ? `Ask about ${uploadedFile.filename}…` : 'Ask for an insight…'}
                disabled={isLoading}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                title="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main workspace */}
        <div className="main-content">
          {currentSpec ? (
            <Dashboard spec={currentSpec} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Bot size={72} />
              </div>
              <h2>No Dashboard Yet</h2>
              <p>Upload your own CSV or type a query in the chat to generate an AI-powered dashboard instantly.</p>
              {!uploadedFile && (
                <span className="empty-hint">Try: "Show me monthly online orders vs store visits."</span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
