import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { updateProfileSuccess } from '../../features/authSlice.js';
import { AtSign, CheckCircle2, Sparkles, UserPen } from 'lucide-react';

const profileIsComplete = (user) => Boolean(user?.profileComplete || (user?.username && user?.bio && user?.interests?.length));

const ProfileCompletionGate = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Junior');
  const [interests, setInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const shouldShow = useMemo(() => user && !profileIsComplete(user), [user]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || '');
    setBio(user.bio || '');
    setExperienceLevel(user.experienceLevel || 'Fresher');
    setInterests(user.interests?.join(', ') || '');
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !bio.trim() || !interests.trim()) {
      setError('Username, bio and interests are required to continue.');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put('/api/users/profile', {
        username,
        bio,
        experienceLevel,
        interests: interests.split(',').map(item => item.trim()).filter(Boolean)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(updateProfileSuccess(res.data.user));
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles size={21} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Complete your profile</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Set your public identity before using Orbitus.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">Unique Username</label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                className="field-input py-3 pl-11 pr-4 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              placeholder="What do you teach, learn, or build?"
              className="field-input resize-none px-4 py-3 text-sm"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">Experience</label>
              <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                className="field-input px-4 py-3 text-sm"
              >
                <option value="Junior">Fresher</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">Interests</label>
              <input
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
                placeholder="React, UI, AI"
                className="field-input px-4 py-3 text-sm"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><UserPen size={17} /><span>Save Profile</span><CheckCircle2 size={17} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionGate;
