import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog.jsx';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' }
];

const ReportContentButton = ({ targetType, targetId, compact = false }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitReport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/moderation/reports', {
        targetType,
        targetId,
        reason,
        details: details.trim()
      });
      setMessage('Report sent to the moderation team.');
      setDetails('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit this report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setMessage('');
          setError('');
        }}
        className={compact
          ? 'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-app hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
          : 'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-muted hover:bg-slate-100 hover:text-app dark:border-slate-700 dark:hover:bg-slate-800'}
        aria-label={`Report ${targetType}`}
      >
        <Flag size={14} />
        <span>{compact ? `Report ${targetType}` : 'Report'}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {targetType}</DialogTitle>
            <DialogDescription>
              Reports are reviewed by the Orbitus moderation team. Please choose the closest reason.
            </DialogDescription>
          </DialogHeader>
          {message ? (
            <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          ) : (
            <form onSubmit={submitReport} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-app">
                Reason
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {REPORT_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-app">
                Details (optional)
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value.slice(0, 1000))}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-app dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Submit report'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportContentButton;
