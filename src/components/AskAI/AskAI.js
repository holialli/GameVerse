import React, { useState } from 'react';
import styles from './AskAI.module.css';

const AskAI = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Closed by default; user opens the widget when needed
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => setCollapsed(c => !c);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse(null);
    // Clear the input immediately to show message was sent
    const currentPrompt = prompt;
    setPrompt('');
    try {
      await sendPrompt(currentPrompt);
    } finally {
      setIsLoading(false);
    }
  };

  // Extracted function so other controls (retry) can call it.
  const sendPrompt = async (text) => {
    setError(null);
    setResponse(null);

    const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;

    const serverUrl = '/api/ai/chat';
    try {
      const serverRes = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json && json.answer) {
          setResponse({ type: 'text', text: json.answer, provider: 'GameVerse AI' });
          return true;
        }
      }
    } catch (serverErr) {
      console.info('Server AI request failed.');
    }

    if (GEMINI_KEY) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
        const systemContext = "You are a helpful AI assistant for a gaming website called GameVerse. Answer concisely and cite brief sources when possible.";
        const body = { contents: [{ parts: [{ text: `${systemContext}\n\nUser Question: ${text}` }] }] };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const data = await res.json();
          const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiAnswer) {
            setResponse({ type: 'text', text: aiAnswer, provider: 'Gemini' });
            return true;
          }
        }
      } catch (e) {
        console.info('Gemini client request failed.', e);
      }
    }

    return false;
  };

  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    const ok = await sendPrompt(prompt || '');
    setIsLoading(false);
    if (!ok) setError('AI service is unavailable right now. Please try again in a moment.');
  };

  return (
    <>
      {collapsed ? (
        <div className={`${styles.aiBoxFixed} ${styles.collapsed}`}>
          <button className={styles.aiToggleBtn} onClick={toggleCollapsed} aria-label="Open Ask AI">AI</button>
        </div>
      ) : (
        <div className={`${styles.aiBoxFixed} ${styles.expanded}`}>
          <div className={styles.aiInner}>
          <div className={styles.aiHeader}>
            <h3 className={styles.aiTitle}>Ask AI</h3>
            <button className={styles.aiToggleBtn} onClick={toggleCollapsed} aria-label="Minimize Ask AI">—</button>
          </div>
          
          <p className={styles.aiDesc}>Ask GameVerse AI — releases, tips, esports updates.</p>

          <div className={styles.aiOutput} aria-live="polite">
            {error && (
              <div className={styles.aiError}>
                {error}
                <button className={styles.aiRetry} onClick={handleRetry} aria-label="Retry">Retry</button>
              </div>
            )}

            {response && response.type === 'articles' && (
              <div className={styles.aiResponse}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Top Articles</strong>
                  {response.provider && <small className={styles.aiProvider}>{response.provider}</small>}
                </div>
                <ul className={styles.aiList}>
                  {response.list.map((a, i) => (
                    <li key={i}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
                      {a.source ? <span> <small>({a.source})</small></span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response && response.type === 'text' && (
              <div className={styles.aiResponse}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>GameVerse AI</strong>
                  {response.provider && <small className={styles.aiProvider}>{response.provider}</small>}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{response.text}</div>
              </div>
            )}

            {response && response.type === 'none' && (
              <div className={styles.aiResponse}>{response.text}</div>
            )}

            {!response && !error && (
              <div className={styles.aiResponse}>
                <small>Ask me about release dates, lore, or tips!</small>
              </div>
            )}
          </div>

          <form className={styles.aiForm} onSubmit={handleSubmit}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Who is Mario?'"
              className={styles.aiInput}
            />
            <button type="submit" className={styles.aiButton} disabled={isLoading}>
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AskAI;