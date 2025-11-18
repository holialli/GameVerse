import React, { useState } from 'react';
import styles from './AskAI.module.css';

const AskAI = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setResponse('');

    try {
      // Fetch from the free DummyJSON search API (simulating an AI API)
      const res = await fetch(`https://dummyjson.com/posts/search?q=${prompt}`);
      const data = await res.json();

      if (data.posts && data.posts.length > 0) {
        // Just show the title of the first search result as the "AI response"
        setResponse(data.posts[0].title);
      } else {
        setResponse("I'm not sure about that. Try another topic.");
      }
    } catch (error) {
      setResponse('Error: Could not connect to the AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.aiBox}>
      <h3 className={styles.aiTitle}>Ask AI</h3>
      <p className={styles.aiDesc}>Ask a question about gaming news or topics.</p>
      <form className={styles.aiForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 'new console'"
          className={styles.aiInput}
        />
        <button type="submit" className={styles.aiButton} disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
      {response && (
        <div className={styles.aiResponse}>
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
};

export default AskAI;