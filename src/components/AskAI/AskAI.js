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

    // Client-side fallbacks. Check for known env keys: Gemini/Google or NewsAPI.
    const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
    const NEWS_KEY = process.env.REACT_APP_NEWSAPI_KEY;

    // If a Gemini key is available, prefer it client-side and skip server proxy to respect local-only preference.
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
    // If server proxy exists and no Gemini key, try it first (server may have better LLM access)
    if (!GEMINI_KEY) {
      const serverUrl = '/api/chat';
      try {
        const serverRes = await fetch(serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });

        if (serverRes.ok) {
          const json = await serverRes.json();
          if (json && json.answer) {
            setResponse({ type: 'text', text: json.answer, provider: 'Server' });
            return true;
          }
        }
      } catch (serverErr) {
        console.info('Server proxy not available or failed.');
      }
    }

    if (NEWS_KEY) {
      try {
        const q = encodeURIComponent(text);
        const newsUrl = `https://newsapi.org/v2/everything?q=${q}&pageSize=5&apiKey=${NEWS_KEY}`;
        const nRes = await fetch(newsUrl);
        if (nRes.ok) {
          const nd = await nRes.json();
          if (nd.articles && nd.articles.length > 0) {
            // Map to article objects with title, url, source
            const list = nd.articles.map(a => ({ title: a.title, url: a.url, source: a.source?.name || '' }));
            setResponse({ type: 'articles', list, provider: 'NewsAPI' });
            return true;
          }
        }
      } catch (e) {
        console.info('NewsAPI client request failed.', e);
      }
    }

    // DummyJSON fallback
    try {
      const fRes = await fetch(`https://dummyjson.com/posts/search?q=${encodeURIComponent(text)}`);
      if (fRes.ok) {
        const fd = await fRes.json();
        if (fd.posts && fd.posts.length > 0) {
          // Map to pseudo-article links (DummyJSON doesn't provide external urls)
          const list = fd.posts.slice(0,3).map(p => ({ title: p.title, url: `https://dummyjson.com/posts/${p.id}`, source: 'DummyJSON' }));
          setResponse({ type: 'articles', list, provider: 'DummyJSON' });
          return true;
        }
      }
    } catch (e) {
      console.info('DummyJSON fallback failed.', e);
    }

    return false;
  };

  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    const ok = await sendPrompt(prompt || '');
    setIsLoading(false);
    if (!ok) setError("I'm having trouble connecting to the AI right now. Try again or enable a server proxy for a full chatbot.");
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

            {/* Success Response */}
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
                {/* Note: This preserves newlines from the AI */}
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>{response.text}</div>
              </div>
            )}

            {/* No Result */}
            {response && response.type === 'none' && (
              <div className={styles.aiResponse}>{response.text}</div>
            )}

            {/* Default State */}
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