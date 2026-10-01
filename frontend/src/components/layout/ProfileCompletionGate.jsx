import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../services/apiClient.js';
import { updateProfileSuccess } from '../../features/authSlice.js';
import { AtSign, CheckCircle2, Sparkles, UserPen, X } from 'lucide-react';

const profileIsComplete = (user) => Boolean(user?.profileComplete || (user?.username && user?.bio && user?.interests?.length));

const ProfileCompletionGate = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [interests, setInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

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
      const res = await apiClient.put('/api/users/profile', {
        username,
        bio,
        experienceLevel,
        interests: interests.split(',').map(item => item.trim()).filter(Boolean)
      });
      dispatch(updateProfileSuccess(res.data.user));
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!shouldShow || dismissed) return null;

  return (
    <div role="dialog" data-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#22242a] p-6 shadow-2xl text-app relative">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-muted hover:text-app p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Dismiss for now"
        >
          <X size={18} />
        </button>
        <div className="mb-6 flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
            <Sparkles size={21} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-app">Complete your profile</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
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
                <option value="Fresher">Fresher</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-500">Your Interests & Hobbies</label>
              <input
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
                placeholder="e.g. Photography, Spanish, Guitar, Fitness, Cooking, Design"
                className="field-input px-4 py-3 text-sm"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Languages', 'Music', 'Fitness & Health', 'Design & Art', 'Photography', 'Business', 'Writing', 'Technology', 'Cooking'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const list = interests.split(',').map(s => s.trim()).filter(Boolean);
                      if (!list.includes(tag)) {
                        setInterests([...list, tag].join(', '));
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-muted hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="btn-secondary flex-1"
            >
              Skip for now
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><UserPen size={17} /><span>Save Profile</span><CheckCircle2 size={17} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionGate;
