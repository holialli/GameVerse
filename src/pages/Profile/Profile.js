import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await userAPI.updateProfile(user.id, form, accessToken);
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile(data.user);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1>Profile</h1>
      {!editMode ? (
        <div className={styles.profileInfo}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className={styles.profileAvatar} />
              ) : (
                <div className={styles.placeholderAvatar}>No Avatar</div>
              )}
            </div>
            <div className={styles.profileDetails}>
              <h2>{profile.name}</h2>
              <p className={styles.email}>{profile.email}</p>
              {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
              <button className={styles.editBtn} onClick={() => setEditMode(true)}>Edit Profile</button>
            </div>
          </div>
        </div>
      ) : (
        <form className={styles.editForm} onSubmit={handleUpdate}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </div>
          <div className={styles.formGroup}>
            <label>Avatar URL</label>
            <input name="avatar" value={form.avatar} onChange={handleChange} />
          </div>
          <button className={styles.saveBtn} type="submit">Save</button>
          <button className={styles.cancelBtn} type="button" onClick={() => setEditMode(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
};

export default Profile;
