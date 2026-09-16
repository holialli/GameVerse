import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../lib/axios';
import styles from './ServerWakeNotice.module.css';

// The API runs on Render's free plan, which sleeps after 15 idle minutes and
// takes up to about a minute to wake. This pings /health as soon as a visitor
// lands, so the API is already starting while the page renders, and explains
// the wait if it takes a while. Any request that reaches a sleeping instance
// is held until the instance is up, so page requests don't need to wait on this.

// A warm server answers well within this, so visitors to a warm server never see a flash.
export const SHOW_AFTER_MS = 1500;
// Past a normal cold start plus margin: at this point it is down, not asleep.
export const GIVE_UP_AFTER_MS = 120_000;
const ATTEMPT_TIMEOUT_MS = 70_000;
const RETRY_DELAY_MS = 3_000;
const READY_VISIBLE_MS = 2_500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ServerWakeNotice = () => {
  // 'checking' (hidden) -> 'waking' -> 'ready' -> 'hidden', or -> 'failed'
  const [status, setStatus] = useState('checking');
  const [elapsed, setElapsed] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let controller = null;
    let hideTimer = null;
    let shown = false;
    const startedAt = Date.now();

    const showTimer = setTimeout(() => {
      shown = true;
      setStatus('waking');
    }, SHOW_AFTER_MS);

    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    const pingUntilUp = async () => {
      while (!cancelled && Date.now() - startedAt < GIVE_UP_AFTER_MS) {
        const attemptController = new AbortController();
        controller = attemptController;
        const abortTimer = setTimeout(() => attemptController.abort(), ATTEMPT_TIMEOUT_MS);
        try {
          const res = await fetch(`${API_BASE_URL}/health`, {
            cache: 'no-store',
            signal: attemptController.signal,
          });
          if (res.ok) return true;
        } catch {
          // Asleep behind the proxy, a network blip, or aborted - retry.
        } finally {
          clearTimeout(abortTimer);
        }
        await wait(RETRY_DELAY_MS);
      }
      return false;
    };

    pingUntilUp().then((up) => {
      if (cancelled) return;
      clearTimeout(showTimer);
      clearInterval(tick);
      if (!up) {
        setStatus('failed');
      } else if (!shown) {
        setStatus('hidden');
      } else {
        setStatus('ready');
        hideTimer = setTimeout(() => setStatus('hidden'), READY_VISIBLE_MS);
      }
    });

    return () => {
      cancelled = true;
      controller?.abort();
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(tick);
    };
  }, [attempt]);

  const retry = () => {
    setElapsed(0);
    setDismissed(false);
    setStatus('checking');
    setAttempt((n) => n + 1);
  };

  const visible = !dismissed && (status === 'waking' || status === 'ready' || status === 'failed');

  // The live region stays mounted so screen readers reliably announce changes.
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {visible && (
        <div className={`${styles.notice} ${styles[status] || ''}`}>
          {status === 'waking' && <span className={styles.spinner} aria-hidden="true" />}
          {status === 'ready' && <span className={styles.icon} aria-hidden="true">✓</span>}
          {status === 'failed' && <span className={styles.icon} aria-hidden="true">!</span>}

          <div className={styles.body}>
            {status === 'waking' && (
              <>
                <p className={styles.title}>
                  Starting the server…
                  <span className={styles.elapsed} aria-hidden="true">{elapsed}s</span>
                </p>
                <p className={styles.detail}>
                  GameVerse runs on a free host that sleeps when idle. This usually takes under a minute.
                </p>
              </>
            )}
            {status === 'ready' && <p className={styles.title}>Server is ready.</p>}
            {status === 'failed' && (
              <>
                <p className={styles.title}>Can't reach the server right now.</p>
                <p className={styles.detail}>Some content may not load. Try again in a moment.</p>
                <button type="button" className={styles.retry} onClick={retry}>Try again</button>
              </>
            )}
          </div>

          {status !== 'ready' && (
            <button
              type="button"
              className={styles.close}
              onClick={() => setDismissed(true)}
              aria-label="Dismiss server status"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerWakeNotice;
