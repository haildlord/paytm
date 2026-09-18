import { useEffect, useState } from 'react';

// status: 'form' | 'loading' | 'success' | 'error'
export default function EditProfileModal({ user, onClose, onUpdateSuccess }) {
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('form');
  const [errorMessage, setErrorMessage] = useState('');

  const isBusy = status === 'loading';

  // Close modal on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isBusy) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, onClose]);

  // Close modal on clicking outside backdrop
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !isBusy) onClose();
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setErrorMessage('');

    const trimmedFirstname = firstname.trim();
    const trimmedLastname = lastname.trim();
    const trimmedPassword = password.trim();

    // Client-side validations
    if (trimmedFirstname && trimmedFirstname.length < 3) {
      setStatus('error');
      setErrorMessage('First name must be at least 3 characters long.');
      return;
    }

    if (trimmedLastname && trimmedLastname.length < 3) {
      setStatus('error');
      setErrorMessage('Last name must be at least 3 characters long.');
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 3) {
      setStatus('error');
      setErrorMessage('Password must be at least 3 characters long.');
      return;
    }

    // Build update payload - only include fields that are modified or provided
    const payload = {};
    if (trimmedFirstname && trimmedFirstname !== user?.firstname) {
      payload.firstname = trimmedFirstname;
    }
    if (trimmedLastname && trimmedLastname !== user?.lastname) {
      payload.lastname = trimmedLastname;
    }
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    if (Object.keys(payload).length === 0) {
      setStatus('error');
      setErrorMessage('No changes were made to your profile.');
      return;
    }

    setStatus('loading');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing. Please log in again.');

      const res = await fetch('http://localhost:3000/api/v1/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setStatus('success');
      if (onUpdateSuccess) {
        onUpdateSuccess({
          firstname: payload.firstname || user?.firstname,
          lastname: payload.lastname || user?.lastname
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        {!isBusy && status !== 'success' && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Form State */}
        {status === 'form' && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                {firstname?.[0]?.toUpperCase() || user?.firstname?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-500">Update your personal account details</p>
              </div>
            </div>

            {/* Read-only Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Username / Email
                </label>
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Cannot be changed
                </span>
              </div>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                placeholder="username@example.com"
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 select-none"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="First name"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="Last name"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength={3}
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8 text-center">
            <svg className="h-10 w-10 animate-spin text-slate-900" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-600">Updating your profile...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Profile Updated</h2>
            <p className="mt-1 text-sm text-slate-500">Your profile details have been saved successfully.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Update Failed</h2>
            <p className="mt-1 text-sm text-slate-500">{errorMessage}</p>
            <div className="mt-6 flex w-full gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStatus('form')}
                className="flex-1 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
