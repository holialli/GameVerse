import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ServerWakeNotice, { GIVE_UP_AFTER_MS, SHOW_AFTER_MS } from './ServerWakeNotice';

// Steps timers forward in slices, flushing promises between them, so the
// component's async retry loop can make progress under fake timers.
const advance = async (ms, step = 250) => {
  for (let t = 0; t < ms; t += step) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      jest.advanceTimersByTime(step);
    });
  }
};

describe('ServerWakeNotice', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  it('pings the health endpoint and stays hidden when the server is already awake', async () => {
    global.fetch.mockResolvedValue({ ok: true });
    render(<ServerWakeNotice />);

    await advance(SHOW_AFTER_MS + 1000);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/health$/),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(screen.queryByText(/starting the server/i)).toBeNull();
    expect(screen.queryByText(/server is ready/i)).toBeNull();
  });

  it('explains a cold start, then confirms and hides once the server answers', async () => {
    let respond;
    global.fetch.mockImplementation(() => new Promise((resolve) => { respond = resolve; }));
    render(<ServerWakeNotice />);

    await advance(SHOW_AFTER_MS);
    expect(screen.getByText(/starting the server/i)).toBeTruthy();

    await act(async () => respond({ ok: true }));
    expect(screen.getByText(/server is ready/i)).toBeTruthy();

    await advance(3000);
    expect(screen.queryByText(/server is ready/i)).toBeNull();
  });

  it('keeps retrying, reports failure after the cutoff, and can retry on demand', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<ServerWakeNotice />);

    await advance(GIVE_UP_AFTER_MS + 5000, 1000);
    expect(screen.getByText(/can't reach the server/i)).toBeTruthy();
    const callsBeforeRetry = global.fetch.mock.calls.length;
    expect(callsBeforeRetry).toBeGreaterThan(1);

    global.fetch.mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await advance(500);

    expect(global.fetch.mock.calls.length).toBeGreaterThan(callsBeforeRetry);
    expect(screen.queryByText(/can't reach the server/i)).toBeNull();
  });

  it('can be dismissed while waking', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<ServerWakeNotice />);

    await advance(SHOW_AFTER_MS);
    fireEvent.click(screen.getByRole('button', { name: /dismiss server status/i }));
    expect(screen.queryByText(/starting the server/i)).toBeNull();
  });
});
