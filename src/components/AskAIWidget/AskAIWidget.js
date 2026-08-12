import React, { useState } from 'react';
import styles from './AskAIWidget.module.css';
import axiosInstance from '../../lib/axios';

// Lightweight, public, single-question AI widget wired to the real
// Gemini-backed POST /api/ai/chat endpoint (chatSimple in aiController.js).
// No login required - this is intentionally separate from CommunityChat,
// which is the real-time moderated lobby, not an AI feature.
const renderAnswer = (answer) =>
  answer.split(/(\[\[.*?\]\])/g).map((chunk, idx) => {
    if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
      return (
        <span key={idx} className={styles.tag}>
          {chunk.slice(2, -2)}
        </span>
      );
    }
    return <span key={idx}>{chunk}</span>;
  });

const AskAIWidget = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;

    setLoading(true);
    setError('');
    setAnswer('');
    setSource('');

    try {
      const res = await axiosInstance.post('/ai/chat', { prompt });
      const data = res?.data || {};
      if (data.answer) {
        setAnswer(data.answer);
        setSource(data.source || '');
      } else {
        setError('No answer returned. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reach AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Ask AI</h3>
      <p className={styles.desc}>Ask for a quick game recommendation - no login required.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What's a good chill game after work?"
          className={styles.input}
          maxLength={500}
          disabled={loading}
        />
        <button type="submit" className={styles.button} disabled={loading || !question.trim()}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      {answer ? (
        <div className={styles.answer}>
          {renderAnswer(answer)}
          {source ? <div className={styles.sourceTag}>{source}</div> : null}
        </div>
      ) : null}
    </div>
  );
};

export default AskAIWidget;
