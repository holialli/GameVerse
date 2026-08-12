import React from 'react';
import toast from 'react-hot-toast';

// Non-blocking replacements for window.confirm/prompt, built on react-hot-toast's
// custom toast so destructive actions still get an explicit confirm step but
// don't freeze the tab the way native dialogs do.

export const confirmToast = (message) =>
  new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          style={{
            background: 'var(--bg-elev)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            maxWidth: 360,
          }}
        >
          <p style={{ margin: '0 0 12px' }}>{message}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#e5484d', color: '#fff', cursor: 'pointer' }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      { duration: 15000 }
    );
  });

export const promptToast = (message, defaultValue = '') =>
  new Promise((resolve) => {
    let value = defaultValue;
    toast.custom(
      (t) => (
        <div
          style={{
            background: 'var(--bg-elev)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            maxWidth: 360,
          }}
        >
          <p style={{ margin: '0 0 8px' }}>{message}</p>
          <input
            type="text"
            defaultValue={defaultValue}
            autoFocus
            onChange={(e) => { value = e.target.value; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                toast.dismiss(t.id);
                resolve(value);
              }
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(null);
              }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(value);
              }}
              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        </div>
      ),
      { duration: 30000 }
    );
  });
