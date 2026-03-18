import { useState, useRef } from 'react';
import axios from 'axios';
import { Bot, Sparkles, Send, Upload, FileText, X } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import type { DashboardSpec } from './types';
import './index.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface UploadedFile {
  filename: string;
  rows: number;
  columns: string[];
  session_id: string;
}

const API_UPLOAD = '/api/upload';
const API_QUERY = '/api/query';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your BI Analytics Assistant. Upload a CSV file to get started, or ask about the default demo dataset.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<DashboardSpec | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Please upload a CSV file (.csv).' }]);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(API_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
          },
        ]);
      }
    } catch (error: unknown) {
      const axiosErr = error as import("axios").AxiosError;
      const errMsg = (axiosErr.response?.data as { detail?: string })?.detail || axiosErr.message || 'Upload failed.';
      setMessages(prev => [...prev, { role: 'ai', content: `Upload error: ${errMsg}` }]);
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setCurrentSpec(null);
    setMessages([
      { role: 'ai', content: 'Upload cleared. Using the default demo dataset. Upload a CSV to analyze your own data.' },
    ]);
  };

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    const newMessages = [...messages, { role: 'user', content: query } as Message];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_QUERY, {
        query,
        session_id: uploadedFile?.session_id ?? null,
      });
      const data = response.data;

      if (data.status === 'success') {
        setCurrentSpec(data.data);
        setMessages(prev => [...prev, {
          role: 'ai',
          content: 'Here is your dashboard based on the request.',
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Unexpected response format from the server.' }]);
      }
    } catch (error: unknown) {
      console.error(error);
      const axiosErr = error as import("axios").AxiosError;
      const errMsg = (axiosErr.response?.data as { detail?: string })?.detail || axiosErr.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${errMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar for Chat */}
      <div className="glass-panel sidebar">
        <div className="app-title">
          <Sparkles className="text-accent" size={24} color="#58a6ff" />
          <span>Instant BI Assistant</span>
        </div>

        {/* CSV Upload Zone */}
        {uploadedFile ? (
          <div className="file-info-bar">
            <FileText size={16} color="#58a6ff" />
            <span className="file-info-name" title={uploadedFile.filename}>{uploadedFile.filename}</span>
            <span className="file-info-meta">{uploadedFile.rows.toLocaleString()} rows</span>
            <button className="file-clear-btn" onClick={clearUpload} title="Remove file">
              <X size={14} />
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
              <span className="upload-zone-text">Uploading...</span>
            ) : (
              <>
                <Upload size={20} color="#58a6ff" />
                <span className="upload-zone-text">Drop CSV here or <u>browse</u></span>
              </>
            )}
          </div>
        )}

        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble ai loader">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </div>

        {/* Follow up suggestions */}
        {currentSpec?.follow_up_suggestions && (
          <div className="suggestions-container">
            {currentSpec.follow_up_suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="suggestion-pill"
                onClick={() => handleSend(sug)}
              >
                {sug}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder={uploadedFile ? `Ask about ${uploadedFile.filename}...` : 'Ask for an insight...'}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace for Dashboard */}
      <div className="main-content">
        {currentSpec ? (
          <Dashboard spec={currentSpec} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '16px' }}>
            <Bot size={64} opacity={0.2} />
            <h2>No Dashboard Active</h2>
            <p>Upload your own CSV or type a query to generate a dashboard instantly.</p>
            {!uploadedFile && (
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Demo: "Show me monthly online orders vs store visits."</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
