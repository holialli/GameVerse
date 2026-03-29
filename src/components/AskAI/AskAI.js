import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import styles from './AskAI.module.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AskAI = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const outputRef = useRef(null);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }, []);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!outputRef.current) return;
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (collapsed || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError('');
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError(err?.message || 'Could not connect to community chat.');
    });

    socket.on('history', (history) => {
      setMessages(Array.isArray(history) ? history : []);
    });

    socket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('messageBlocked', ({ reason }) => {
      setError(reason || 'Message was blocked by moderation.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [collapsed, token]);

  const sendMessage = (e) => {
    e.preventDefault();
    setError('');

    const content = String(text || '').trim();
    if (!content) return;

    const socket = socketRef.current;
    if (!socket || !connected) {
      setError('Chat is not connected yet.');
      return;
    }

    socket.emit('sendMessage', {
      content,
      username: user?.username || user?.name || 'User',
    });
    setText('');
  };

  return (
    <>
      {collapsed ? (
        <div className={`${styles.aiBoxFixed} ${styles.collapsed}`}>
          <button className={styles.aiToggleBtn} onClick={() => setCollapsed(false)} aria-label="Open community chat">Chat</button>
        </div>
      ) : (
        <div className={`${styles.aiBoxFixed} ${styles.expanded}`}>
          <div className={styles.aiInner}>
            <div className={styles.aiHeader}>
              <h3 className={styles.aiTitle}>Community Chat</h3>
              <button className={styles.aiToggleBtn} onClick={() => setCollapsed(true)} aria-label="Minimize community chat">—</button>
            </div>

            <p className={styles.aiDesc}>
              Global lobby with moderation enabled. Messages auto-delete after 24 hours.
            </p>

            {!token ? (
              <div className={styles.aiResponse}><small>Please login to join community chat.</small></div>
            ) : null}

            <div className={styles.aiOutput} aria-live="polite" ref={outputRef}>
              {error ? <div className={styles.aiError}>{error}</div> : null}
              {!token ? null : messages.length === 0 ? (
                <div className={styles.aiResponse}><small>No messages yet. Start the conversation.</small></div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={`${msg._id || idx}-${msg.timestamp || idx}`} className={styles.chatMessage}>
                    <div className={styles.chatMeta}>
                      <strong>{msg.username || 'User'}</strong>
                      <small>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</small>
                    </div>
                    <div className={styles.chatBody}>{msg.content}</div>
                  </div>
                ))
              )}
            </div>

            <form className={styles.aiForm} onSubmit={sendMessage}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={connected ? 'Type your message...' : 'Connecting...'}
                className={styles.aiInput}
                maxLength={500}
                disabled={!token || !connected}
              />
              <button type="submit" className={styles.aiButton} disabled={!token || !connected || !text.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AskAI;