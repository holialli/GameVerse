import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../lib/axios';
import styles from './HardwareChecker.module.css';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/SEO/SEO';
import AffiliateDisclosure from '../../components/AffiliateDisclosure/AffiliateDisclosure';

const RAM_OPTIONS = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

const PLATFORM_OPTIONS = [
  { value: 'pc', label: 'PC (Desktop)' },
  { value: 'steamdeck', label: 'Steam Deck' },
  { value: 'ps5', label: 'PlayStation 5' },
  { value: 'xboxseriesx', label: 'Xbox Series X' },
  { value: 'nintendoswitch', label: 'Nintendo Switch' },
];

const HardwareChecker = () => {
  const { isAuthenticated } = useAuth();
  const [libraryGames, setLibraryGames] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [form, setForm] = useState({ rawgId: '', cpuId: '', gpuId: '', ramGb: 16, platform: 'pc' });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [profileLimit, setProfileLimit] = useState(1);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get('/hardware/profiles');
      setProfiles(Array.isArray(res.data.profiles) ? res.data.profiles : []);
      setProfileLimit(res.data.limit || 1);
    } catch (err) {
      // Non-blocking.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const hardwareRes = await axiosInstance.get('/hardware/index');
        const tracked = isAuthenticated
          ? await axiosInstance.get('/users/games/library').then((libraryRes) => (
            Array.isArray(libraryRes.data.games)
              ? libraryRes.data.games.filter((g) => g.status === 'library' || g.status === 'watchlist')
              : []
          ))
          : [];

        const hw = Array.isArray(hardwareRes.data.hardware) ? hardwareRes.data.hardware : [];

        setLibraryGames(tracked);
        setHardware(hw);
        await loadProfiles();

        const firstCpu = hw.find((h) => h.type === 'cpu');
        const firstGpu = hw.find((h) => h.type === 'gpu');

        setForm({
          rawgId: tracked[0]?.rawgId ? String(tracked[0].rawgId) : '',
          cpuId: firstCpu?._id || '',
          gpuId: firstGpu?._id || '',
          ramGb: 16,
          platform: 'pc',
        });
      } catch (err) {
        setError('Failed to load compatibility data.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAuthenticated, loadProfiles]);

  const cpus = useMemo(() => hardware.filter((h) => h.type === 'cpu'), [hardware]);
  const gpus = useMemo(() => hardware.filter((h) => h.type === 'gpu'), [hardware]);

  const checkCompatibility = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Sign in to check compatibility for a game in your library or watchlist.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const params = new URLSearchParams({
        cpuId: form.cpuId,
        gpuId: form.gpuId,
        ramGb: String(form.ramGb),
        platform: form.platform,
      });

      const res = await axiosInstance.get(`/hardware/compatibility/${form.rawgId}?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      setResult(null);
      setError(err?.response?.data?.error || 'Compatibility check failed');
    } finally {
      setIsChecking(false);
    }
  };

  const saveProfile = async () => {
    const name = window.prompt('Name this hardware profile (e.g. "Gaming PC"):', 'My PC');
    if (!name) return;

    setSavingProfile(true);
    try {
      await axiosInstance.post('/hardware/profiles', {
        name,
        cpuId: form.cpuId,
        gpuId: form.gpuId,
        ramGb: form.ramGb,
        platform: form.platform,
      });
      toast.success('Hardware profile saved.');
      await loadProfiles();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const loadProfileIntoForm = (profileId) => {
    const profile = profiles.find((p) => p._id === profileId);
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      cpuId: profile.cpuId || prev.cpuId,
      gpuId: profile.gpuId || prev.gpuId,
      ramGb: profile.ramGb || prev.ramGb,
      platform: profile.platform || prev.platform,
    }));
  };

  if (isLoading) return <section className={styles.page}><p>Loading compatibility data...</p></section>;

  const resultTierClass = result?.tier === 'green'
    ? styles.statusGreen
    : result?.tier === 'yellow'
      ? styles.statusYellow
      : result?.tier === 'red'
        ? styles.statusRed
        : '';

  return (
    <section className={styles.page}>
      <SEO
        title="Compatibility Lab"
        description="Compare tracked games against GameVerse hardware profiles and performance estimates."
        url="https://game-verse.tech/compatibility"
      />
      <header className={styles.header}>
        <h1>Compatibility Lab</h1>
        <p>Evaluate performance for games you already track in your library/watchlist.</p>
        {!isAuthenticated && (
          <p className={styles.publicNote}>
            The hardware catalog is public. Sign in to run full compatibility checks against your tracked games.
          </p>
        )}
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {isAuthenticated && (
        <div className={styles.profilesRow}>
          {profiles.length > 0 && (
            <label>
              Saved Profiles
              <select onChange={(e) => loadProfileIntoForm(e.target.value)} defaultValue="">
                <option value="" disabled>Load a saved profile...</option>
                {profiles.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile || !form.cpuId || !form.gpuId || profiles.length >= profileLimit}
            title={profiles.length >= profileLimit ? `Your plan allows ${profileLimit} saved profile(s) - upgrade to Premium for more.` : ''}
          >
            {savingProfile ? 'Saving...' : `Save Current as Profile (${profiles.length}/${profileLimit})`}
          </button>
        </div>
      )}

      <form className={styles.form} onSubmit={checkCompatibility}>
        <label>
          Select Game (From Your Library/Watchlist)
          <select
            value={form.rawgId}
            onChange={(e) => setForm((p) => ({ ...p, rawgId: e.target.value }))}
            disabled={!isAuthenticated}
          >
            {isAuthenticated ? (
              libraryGames.map((g) => (
                <option key={`${g.rawgId}-${g.status}`} value={g.rawgId}>{g.title} ({g.status})</option>
              ))
            ) : (
              <option value="">Sign in to choose a tracked game</option>
            )}
          </select>
        </label>

        <label>
          CPU
          <select value={form.cpuId} onChange={(e) => setForm((p) => ({ ...p, cpuId: e.target.value }))}>
            {cpus.map((cpu) => (
              <option key={cpu._id} value={cpu._id}>{cpu.name}</option>
            ))}
          </select>
        </label>

        <label>
          GPU
          <select value={form.gpuId} onChange={(e) => setForm((p) => ({ ...p, gpuId: e.target.value }))}>
            {gpus.map((gpu) => (
              <option key={gpu._id} value={gpu._id}>{gpu.name}</option>
            ))}
          </select>
        </label>

        <label>
          RAM (GB)
          <select
            value={form.ramGb}
            onChange={(e) => setForm((p) => ({ ...p, ramGb: Number(e.target.value) || 0 }))}
          >
            {RAM_OPTIONS.map((ramValue) => (
              <option key={ramValue} value={ramValue}>{ramValue} GB</option>
            ))}
          </select>
        </label>

        <label>
          Target Platform
          <select
            value={form.platform}
            onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
          >
            {PLATFORM_OPTIONS.map((platformOption) => (
              <option key={platformOption.value} value={platformOption.value}>{platformOption.label}</option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isChecking || !isAuthenticated || !form.rawgId || !form.cpuId || !form.gpuId}>
          {isChecking ? 'Evaluating...' : 'Evaluate Performance'}
        </button>
      </form>

      {!isAuthenticated ? (
        <div className={styles.emptyHint}>
          <p>You can browse the hardware catalog publicly, but full compatibility checks require a signed-in account.</p>
          <Link to="/login">Sign in to continue</Link>
        </div>
      ) : libraryGames.length === 0 ? (
        <p className={styles.emptyHint}>You have no tracked games yet. Add games from the Game Radar page first.</p>
      ) : null}

      {result && (
        <article className={`${styles.result} ${resultTierClass}`.trim()}>
          <h2>{result.game?.title}</h2>
          <p><strong>Status:</strong> {result.status} ({result.tier})</p>
          <p><strong>Main Bottleneck:</strong> {result.bottleneck}</p>
          <p><strong>Target Platform:</strong> {result.details?.platform?.label || 'PC (Desktop)'}</p>
          <p><strong>Estimated FPS:</strong> Low {result.estimatedFps?.low} | Medium {result.estimatedFps?.medium} | High {result.estimatedFps?.high}</p>

          {result.gameSpecific?.available && (
            <p className={styles.gameSpecific}>
              <strong>Against this game's actual requirements:</strong>{' '}
              {result.gameSpecific.meetsRecommended
                ? 'Meets recommended specs.'
                : result.gameSpecific.meetsMinimum
                  ? 'Meets minimum specs, below recommended.'
                  : 'Below published minimum specs.'}
              {result.gameSpecific.matchConfidence === 'low' && ' (low-confidence match)'}
            </p>
          )}

          <h3>Optimization Tips</h3>
          <ul>
            {(result.tips || []).map((tip, idx) => <li key={idx}>{tip}</li>)}
          </ul>

          {result.tipLinks?.length > 0 && (
            <div className={styles.tipLinks}>
              <h3>Consider Upgrading</h3>
              <div className={styles.tipLinksRow}>
                {result.tipLinks.map((link, idx) => (
                  <a
                    key={`${link.store}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <AffiliateDisclosure />
            </div>
          )}
        </article>
      )}

      <div className={styles.tierPromo}>
        <p>Not sure which tier your PC falls into? Browse curated picks:</p>
        <div className={styles.tierPromoRow}>
          <Link to="/best-games/budget">Budget PC</Link>
          <Link to="/best-games/mid-range">Mid-Range PC</Link>
          <Link to="/best-games/high-end">High-End PC</Link>
        </div>
      </div>
    </section>
  );
};

export default HardwareChecker;
