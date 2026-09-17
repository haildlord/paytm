import { useEffect, useState } from 'react';

// status: 'form' | 'loading' | 'success' | 'error'
export default function SendMoneyModal({ user, balance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('form');
  const [errorMessage, setErrorMessage] = useState('');

  const isBusy = status === 'loading';

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isBusy) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, onClose]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !isBusy) onClose();
  }

  function handleSend(e) {
    e.preventDefault();
    const value = Number(amount);

    if (!value || value <= 0) {
      setStatus('error');
      setErrorMessage('Enter a valid amount.');
      return;
    }

    if (typeof balance === 'number' && value > balance) {
      setStatus('error');
      setErrorMessage('Insufficient balance for this transfer.');
      return;
    }

    setStatus('loading');

    // TODO: replace with real POST /api/v1/account/transfer call.
    // On success, call setStatus('success'); on failure, setErrorMessage(...) then setStatus('error').
    setTimeout(() => {
      const succeeded = Math.random() > 0.15;
      if (succeeded) {
        setStatus('success');
        onSuccess?.(value);
      } else {
        setErrorMessage('The transfer could not be completed. Please try again.');
        setStatus('error');
      }
    }, 1100);
  }

  return (
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {!isBusy && (
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

        {status === 'form' && (
          <form onSubmit={handleSend}>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Send Money</h2>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                {user?.firstName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                {typeof balance === 'number' && (
                  <p className="text-xs text-slate-500">Your balance: ₹{balance}</p>
                )}
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (in ₹)</label>
            <input
              type="number"
              min="1"
              autoFocus
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Send
              </button>
            </div>
          </form>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center py-8 text-center">
            <svg className="h-10 w-10 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-600">Processing transfer...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Transfer successful</h2>
            <p className="mt-1 text-sm text-slate-500">
              ₹{amount} sent to {user?.firstName} {user?.lastName}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-7 w-7 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Transfer failed</h2>
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
