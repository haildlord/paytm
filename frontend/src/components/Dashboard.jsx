import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SendMoneyModal from './SendMoneyModal';
import EditProfileModal from './EditProfileModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // --- States ---
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Loading & Error states
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // UI interaction states
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // --- Click Outside Hook ---
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Initial Data Fetch (Current User) ---
  useEffect(() => {
    async function fetchInitialData() {
      setIsUserLoading(true);
      setUserError('');

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token missing");

        const res = await fetch('http://localhost:3000/api/v1/account/user-info', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch user data");
        }

        setLoggedInUser(data);
      } catch (err) {
        setUserError(err.message);
        navigate('/signin');
      } finally {
        setIsUserLoading(false);
      }
    }
    
    fetchInitialData();
  }, [navigate]);

  // --- Debounced Search Fetch (User List) ---
  useEffect(() => {
    async function fetchFilteredUsers() {
      setIsSearching(true);
      setSearchError('');

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/v1/user/bulk?filter=${search}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to search users");
        }
        
        setUsers(data.users || []);
      } catch (error) {
        setSearchError(error.message);
        setUsers([]); // Reset users on error
      } finally {
        setIsSearching(false);
      }
    }

    // Debounce API call by 300ms so we don't spam the server while typing
    const timeoutId = setTimeout(() => {
      fetchFilteredUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // --- Handlers ---
  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/signin');
  }

  function handleTransferSuccess(amount) {
    // Correctly update the user's balance in state
    setLoggedInUser((prev) => ({
      ...prev,
      balance: prev.balance - amount
    }));
  }

  function handleProfileUpdateSuccess(updatedFields) {
    setLoggedInUser((prev) => ({
      ...prev,
      ...updatedFields
    }));
  }

  // --- Renders ---
  
  // 1. Initial Full Page Loading State
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-lg font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  // 2. Fatal Error State (e.g., token expired)
  if (userError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="text-rose-500 font-medium">{userError}</div>
        <button onClick={handleLogout} className="text-sm underline text-slate-600">Back to Login</button>
      </div>
    );
  }

  // 3. Main Dashboard UI
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Navbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            P
          </div>
          <h1 className="text-lg font-bold text-slate-900">Payments App</h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
            title="Account Menu"
          >
            <span className="hidden text-sm font-medium text-slate-600 sm:block">
              Hello, {loggedInUser?.firstname}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
              {loggedInUser?.firstname?.[0]?.toUpperCase()}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-20">
              {/* User overview snippet */}
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {loggedInUser?.firstname} {loggedInUser?.lastname || ''}
                </p>
                {loggedInUser?.username && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {loggedInUser.username}
                  </p>
                )}
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        
        {/* Balance Card */}
        <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-md">
          <p className="text-sm font-medium text-slate-300">Your Balance</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            ₹{loggedInUser?.balance?.toLocaleString('en-IN') || '0'}
          </p>
        </div>

        {/* Users Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Directory</h3>
          {isSearching && <span className="animate-pulse text-xs text-slate-400">Searching...</span>}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
          />
        </div>

        {/* Error handling for search */}
        {searchError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
            {searchError}
          </div>
        )}

        {/* User List Container */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {!isSearching && users.length === 0 && !searchError && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-400">No users found.</p>
            </div>
          )}
          
          {loggedInUser && users
            .filter((user) => user._id !== (loggedInUser.userid || loggedInUser._id)) // Extra safety fallback
            .map((user, i, filteredUsers) => (
              <div
                key={user._id}
                className={`flex items-center justify-between px-5 py-4 transition hover:bg-slate-50 ${
                  i !== filteredUsers.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {user.firstname[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-900">
                      {user.firstname} {user.lastname}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Send Money
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Send Money Modal */}
      {selectedUser && loggedInUser && (
        <div className="text-slate-900">
          <SendMoneyModal
             user={selectedUser}
             balance={loggedInUser.balance}
             onClose={() => setSelectedUser(null)}
             onSuccess={handleTransferSuccess}
          />
        </div>
      )}

      {/* Edit Profile Modal */}
      {isProfileModalOpen && loggedInUser && (
        <div className="text-slate-900">
          <EditProfileModal
            user={loggedInUser}
            onClose={() => setIsProfileModalOpen(false)}
            onUpdateSuccess={handleProfileUpdateSuccess}
          />
        </div>
      )}
    </div>
  );
}
