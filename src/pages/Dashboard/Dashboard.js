import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await userAPI.getDashboard(user.id);
        setDashboard(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user && accessToken) fetchDashboard();
  }, [user, accessToken]);

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!dashboard) return <div className={styles.error}>No dashboard data yet.</div>;

  const isAdmin = dashboard.user?.role === 'admin';
  const platformData = dashboard.stats?.platformBreakdown || [];
  const genreData = dashboard.genreBreakdown || [];
  const totalPlatforms = platformData.reduce((sum, p) => sum + p.count, 0) || 1;
  const totalGenres = genreData.reduce((sum, g) => sum + g.count, 0) || 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{isAdmin ? 'Admin Dashboard' : 'Dashboard'}</h1>
          <p className={styles.muted}>Welcome back, {dashboard.user?.name}!</p>
        </div>
      </div>

      {isAdmin ? (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}>📊</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Total Games</div>
                <div className={styles.kpiValue}>{dashboard.stats?.totalGames || 0}</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #4ECDC4, #7DDDD1)' }}>👥</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Total Users</div>
                <div className={styles.kpiValue}>{dashboard.stats?.totalUsers || 0}</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #FFD93D, #FFEB99)' }}>💰</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Total Purchases</div>
                <div className={styles.kpiValue}>{dashboard.stats?.totalPurchases || 0}</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #A8E6CF, #C8F3E0)' }}>⭐</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Avg Rating</div>
                <div className={styles.kpiValue}>{dashboard.stats?.averageRating || 0}/10</div>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Platform Distribution</h3>
              <div className={styles.chartContainer}>
                {platformData.length === 0 ? (
                  <p className={styles.emptyState}>No platform data</p>
                ) : (
                  platformData.map((p) => (
                    <div key={p._id} className={styles.chartBar}>
                      <div className={styles.chartLabel}>{p._id}</div>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.bar}
                          style={{
                            width: `${(p.count / totalPlatforms) * 100}%`,
                            background: `hsl(${Math.random() * 360}, 70%, 60%)`
                          }}
                        />
                      </div>
                      <div className={styles.chartValue}>{p.count}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Genre Distribution</h3>
              <div className={styles.chartContainer}>
                {genreData.length === 0 ? (
                  <p className={styles.emptyState}>No genre data</p>
                ) : (
                  genreData.slice(0, 6).map((g) => (
                    <div key={g._id} className={styles.chartBar}>
                      <div className={styles.chartLabel}>{g._id}</div>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.bar}
                          style={{
                            width: `${(g.count / totalGenres) * 100}%`,
                            background: `hsl(${Math.random() * 360}, 70%, 60%)`
                          }}
                        />
                      </div>
                      <div className={styles.chartValue}>{g.count}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>⭐ Top Rated Games</h3>
              <div className={styles.listContainer}>
                {(!dashboard.topRatedGames || dashboard.topRatedGames.length === 0) ? (
                  <p className={styles.emptyState}>No games yet</p>
                ) : (
                  <ul className={styles.list}>
                    {dashboard.topRatedGames.slice(0, 5).map((game, idx) => (
                      <li key={game._id} className={styles.listItem}>
                        <span className={styles.rank}>#{idx + 1}</span>
                        <span className={styles.title}>{game.title}</span>
                        <span className={styles.badge}>{game.rating}/10</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🎮 Recent Games</h3>
              <div className={styles.listContainer}>
                {(!dashboard.recentGames || dashboard.recentGames.length === 0) ? (
                  <p className={styles.emptyState}>No games yet</p>
                ) : (
                  <ul className={styles.list}>
                    {dashboard.recentGames.slice(0, 5).map((game) => (
                      <li key={game._id} className={styles.listItem}>
                        <span className={styles.title}>{game.title}</span>
                        <span className={styles.badge}>{game.genre}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}>🛒</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Games Purchased</div>
                <div className={styles.kpiValue}>{dashboard.stats?.totalPurchased || 0}</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #4ECDC4, #7DDDD1)' }}>🎮</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Active Rentals</div>
                <div className={styles.kpiValue}>{dashboard.stats?.totalRenting || 0}</div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #FFD93D, #FFEB99)' }}>💵</div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>Total Spent</div>
                <div className={styles.kpiValue}>${(dashboard.stats?.totalSpent || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📦 Recent Purchases</h3>
              <div className={styles.listContainer}>
                {(!dashboard.recentPurchases || dashboard.recentPurchases.length === 0) ? (
                  <p className={styles.emptyState}>No purchases yet</p>
                ) : (
                  <ul className={styles.list}>
                    {dashboard.recentPurchases.slice(0, 5).map((purchase) => (
                      <li key={purchase._id} className={styles.listItem}>
                        <span className={styles.title}>{purchase.gameId?.title}</span>
                        <span className={styles.badge}>${purchase.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🎬 Active Rentals</h3>
              <div className={styles.listContainer}>
                {(!dashboard.activeRentals || dashboard.activeRentals.length === 0) ? (
                  <p className={styles.emptyState}>No active rentals</p>
                ) : (
                  <ul className={styles.list}>
                    {dashboard.activeRentals.slice(0, 5).map((rental) => (
                      <li key={rental._id} className={styles.listItem}>
                        <span className={styles.title}>{rental.gameId?.title}</span>
                        <span className={styles.badge}>{new Date(rental.expiryDate).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
