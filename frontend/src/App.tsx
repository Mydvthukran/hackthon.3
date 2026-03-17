import { useState } from 'react';
import axios from 'axios';
import { Bot, Sparkles, Send } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import type { DashboardSpec } from './types';
import './index.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const API_URL = '/api/query';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your BI Analytics Assistant. What insights would you like to see today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<DashboardSpec | null>(null);

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    const newMessages = [...messages, { role: 'user', content: query } as Message];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, { query });
      const data = response.data;
      
      if (data.status === 'success') {
        setCurrentSpec(data.data);
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: 'Here is your dashboard based on the request.' 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Unexpected response format from the server.' }]);
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.detail || error.message || 'Unknown error occurred.';
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
              placeholder="Ask for an insight..."
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
            <p>Type a natural language query on the left to instantly generate a complete dashboard.</p>
            <p style={{fontSize: '12px', opacity: 0.7}}>Try: "Show me monthly online orders vs store visits, and average spend by age."</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
