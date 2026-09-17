import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SendMoneyModal from './SendMoneyModal';

export default function Dashboard() {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(5000);
  const [users] = useState([
    { id: 1, firstName: 'User', lastName: '1' },
    { id: 2, firstName: 'User', lastName: '2' },
    { id: 3, firstName: 'User', lastName: '3' },
  ]);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    navigate('/signin');
  }

  function handleTransferSuccess(amount) {
    setBalance((b) => b - amount);
  }

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            P
          </div>
          <h1 className="text-lg font-bold text-slate-900">Payments App</h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 transition hover:bg-slate-100"
          >
            <span className="text-sm font-medium text-slate-600">Hello, User</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
              U
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm text-slate-300">Your Balance</p>
          <p className="mt-1 text-3xl font-bold">₹{balance.toLocaleString('en-IN')}</p>
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Users</h3>
        <div className="relative mb-4">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
          />
        </div>

        {/* User List */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filteredUsers.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No users found.</p>
          )}
          {filteredUsers.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center justify-between px-4 py-3.5 ${
                i !== filteredUsers.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <span className="font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <button
                onClick={() => setSelectedUser(user)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Send Money
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && (
        <SendMoneyModal
          user={selectedUser}
          balance={balance}
          onClose={() => setSelectedUser(null)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}
