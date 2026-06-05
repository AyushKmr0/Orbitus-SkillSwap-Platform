import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { logout } from '../../features/authSlice.js';

const Settings = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');
  const [deleting, setDeleting] = useState(false);

  const normalizedConfirm = confirmUsername.trim().toLowerCase();
  const canDelete = useMemo(() => normalizedConfirm === user?.username, [normalizedConfirm, user?.username]);

  const deleteAccount = async () => {
    if (!canDelete || deleting) return;

    setDeleting(true);
    setDeleteStatus('');
    try {
      await axios.delete('/api/users/account', {
        headers: { Authorization: `Bearer ${token}` },
        data: { username: confirmUsername }
      });
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteStatus(err.response?.data?.message || 'Account delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-app">Settings</h1>
            <p className="mt-1 text-sm text-muted">Manage account security and permanent account actions.</p>
          </div>
        </div>

        <section className="section-panel space-y-5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-app">Delete Account</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                This permanently removes your profile, posts, chats, sessions, roadmaps, certificates, notifications, and leaderboard entry.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <label className="block text-xs font-bold uppercase text-red-600">
              Type @{user?.username || 'username'} to confirm
            </label>
            <input
              type="text"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="field-input mt-2 px-3 py-2 text-sm"
              placeholder={user?.username || 'username'}
            />
            {deleteStatus && <p className="mt-2 text-xs font-semibold text-red-600">{deleteStatus}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={deleteAccount}
              disabled={!canDelete || deleting}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
