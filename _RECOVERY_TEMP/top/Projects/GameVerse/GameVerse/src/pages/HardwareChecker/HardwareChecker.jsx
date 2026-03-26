import React, { useEffect, useMemo, useState } from 'react';
import styles from './HardwareChecker.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

const HardwareChecker = () => {
  const [games, setGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [form, setForm] = useState({ gameId: '', cpuId: '', gpuId: '', ramGb: 16 });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [gamesRes, hardwareRes] = await Promise.all([
          fetch(`${API_BASE_URL}/games?limit=200`),
          fetch(`${API_BASE_URL}/hardware/index`),
        ]);

        if (!gamesRes.ok || !hardwareRes.ok) {
          throw new Error('Failed to load compatibility catalog');
        }

        const gamesJson = await gamesRes.json();
        const hardwareJson = await hardwareRes.json();

        const loadedGames = Array.isArray(gamesJson.games) ? gamesJson.games : [];
        const loadedHardware = Array.isArray(hardwareJson) ? hardwareJson : [];

        setGames(loadedGames);
        setHardware(loadedHardware);

        const firstCpu = loadedHardware.find((h) => h.type === 'cpu');
        const firstGpu = loadedHardware.find((h) => h.type === 'gpu');

        setForm((prev) => ({
          ...prev,
          gameId: loadedGames[0]?._id || '',
          cpuId: firstCpu?._id || '',
          gpuId: firstGpu?._id || '',
        }));
      } catch (err) {
        setError(err.message || 'Failed to initialize checker');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const cpus = useMemo(() => hardware.filter((h) => h.type === 'cpu'), [hardware]);
  const gpus = useMemo(() => hardware.filter((h) => h.type === 'gpu'), [hardware]);

  const handleChange = (key, value) => {
    setResult(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const checkCompatibility = async (e) => {
    e.preventDefault();
    if (!form.gameId || !form.cpuId || !form.gpuId) {
      setError('Select a game, CPU, and GPU first.');
      return;
    }

    setError('');
    setIsChecking(true);
    try {
      const params = new URLSearchParams({
        cpuId: form.cpuId,
        gpuId: form.gpuId,
        ramGb: String(form.ramGb || 0),
      });

      const res = await fetch(`${API_BASE_URL}/hardware/compatibility/${form.gameId}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Compatibility check failed');

      setResult(json);
    } catch (err) {
      setError(err.message || 'Compatibility check failed');
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) return <section className={styles.page}><p>Loading compatibility data...</p></section>;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Hardware Compatibility Checker</h1>
        <p>Select your rig and game to see if it can run smoothly.</p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={checkCompatibility}>
        <label>
          Game
          <select value={form.gameId} onChange={(e) => handleChange('gameId', e.target.value)}>
            {games.map((game) => (
              <option key={game._id} value={game._id}>{game.title}</option>
            ))}
          </select>
        </label>

        <label>
          CPU
          <select value={form.cpuId} onChange={(e) => handleChange('cpuId', e.target.value)}>
            {cpus.map((cpu) => (
              <option key={cpu._id} value={cpu._id}>{cpu.name}</option>
            ))}
          </select>
        </label>

        <label>
          GPU
          <select value={form.gpuId} onChange={(e) => handleChange('gpuId', e.target.value)}>
            {gpus.map((gpu) => (
              <option key={gpu._id} value={gpu._id}>{gpu.name}</option>
            ))}
          </select>
        </label>

        <label>
          RAM (GB)
          <input
            type="number"
            min="4"
            max="128"
            value={form.ramGb}
            onChange={(e) => handleChange('ramGb', Number(e.target.value) || 0)}
          />
        </label>

        <button type="submit" disabled={isChecking}>{isChecking ? 'Checking...' : 'Check Compatibility'}</button>
      </form>

      {result && (
        <article className={`${styles.result} ${styles[`status${result.status}`] || ''}`}>
          <h2>Status: {result.status}</h2>
          <p>Tier reached: {result.tier}</p>
          <p>Main bottleneck: {result.bottleneck}</p>
          <p>CPU rank: {result.details?.cpuRank ?? 'N/A'} | GPU rank: {result.details?.gpuRank ?? 'N/A'}</p>
        </article>
      )}
    </section>
  );
};

export default HardwareChecker;
