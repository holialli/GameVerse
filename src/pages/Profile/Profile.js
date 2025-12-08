import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userAPI.getUserProfile(user.id);
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);
        setForm({ name: data.name, bio: data.bio || '', avatar: data.avatar || '' });

        // Fetch dashboard for additional stats
        const dashData = await userAPI.getDashboard(user.id);
        setDashboard(dashData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please upload an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, avatar: event.target.result || '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');
    try {
      const res = await userAPI.updateProfile(user.id, form, accessToken);
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile(data.user);
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (error && !profile) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>My Profile</h1>
          <p className={styles.muted}>Manage your account and preferences</p>
        </div>
      </div>

      {successMessage && <div className={styles.success}>{successMessage}</div>}
      {error && editMode && <div className={styles.errorMsg}>{error}</div>}

      {!editMode ? (
        <>
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <div className={styles.avatarSection}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className={styles.profileAvatar} />
                ) : (
                  <div className={styles.placeholderAvatar}>{profile.name?.[0]?.toUpperCase()}</div>
                )}
              </div>
              <div className={styles.profileDetails}>
                <h2>{profile.name}</h2>
                <p className={styles.email}>{profile.email}</p>
                <p className={styles.role}>
                  <span className={styles.roleBadge}>{profile.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                </p>
                {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
              </div>
            </div>
            <button className={styles.editBtn} onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>

          {dashboard && (
            <div className={styles.statsGrid}>
              {profile.role === 'user' ? (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📦</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Games Owned</div>
                      <div className={styles.statValue}>{dashboard.stats?.totalPurchased || 0}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎮</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Active Rentals</div>
                      <div className={styles.statValue}>{dashboard.stats?.totalRenting || 0}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💵</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Total Spent</div>
                      <div className={styles.statValue}>${(dashboard.stats?.totalSpent || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Account Age</div>
                      <div className={styles.statValue}>{Math.floor((new Date() - new Date(profile.createdAt)) / (1000 * 60 * 60 * 24))} days</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Games Created</div>
                      <div className={styles.statValue}>{dashboard.stats?.totalGames || 0}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Total Users</div>
                      <div className={styles.statValue}>{dashboard.stats?.totalUsers || 0}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Total Purchases</div>
                      <div className={styles.statValue}>{dashboard.stats?.totalPurchases || 0}</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>Avg Rating</div>
                      <div className={styles.statValue}>{dashboard.stats?.averageRating || 0}/10</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.editCard}>
          <h3>Edit Your Profile</h3>
          <form className={styles.editForm} onSubmit={handleUpdate}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className={styles.formGroup}>
              <label>Bio / About</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself..." />
            </div>

            <div className={styles.formGroup}>
              <label>Avatar</label>
              <input
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="Paste an image URL"
              />
              <div className={styles.uploadRow}>
                <label htmlFor="avatarUpload" className={styles.uploadLabel}>Or upload a file</label>
                <input
                  type="file"
                  id="avatarUpload"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                />
              </div>
              <p className={styles.helpText}>JPG/PNG/GIF/WebP up to 2MB</p>
              {form.avatar && (
                <div className={styles.avatarPreview}>
                  <img src={form.avatar} alt="Avatar preview" />
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button className={styles.saveBtn} type="submit">Save Changes</button>
              <button className={styles.cancelBtn} type="button" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
