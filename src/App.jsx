import { useState, useEffect, useRef } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import { db, auth, googleProvider } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

// Detect mobile browsers — they block popups, so we use redirect instead
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const INITIAL_PORTFOLIO = [
  {
    id: '1',
    name: 'AAPL',
    type: 'Equity',
    exposureCategory: 'Tech',
    history: {
      '2023-10-01': { capital: 10000, exposureValue: 10000 },
      '2023-10-15': { capital: 10500, exposureValue: 10500 }
    }
  },
  {
    id: '2',
    name: 'SPY Calls (Leveraged)',
    type: 'Options',
    exposureCategory: 'US Market',
    history: {
      '2023-10-01': { capital: 2000, exposureValue: 20000 },
      '2023-10-15': { capital: 2200, exposureValue: 22000 }
    }
  },
  {
    id: '3',
    name: 'US Treasury Bonds',
    type: 'Fixed Income',
    exposureCategory: 'Gov Debt',
    history: {
      '2023-10-01': { capital: 50000, exposureValue: 50000 },
      '2023-10-15': { capital: 50000, exposureValue: 50000 }
    }
  }
];

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState(undefined);      // undefined = checking auth
  const [portfolio, setPortfolio] = useState(null); // null = loading data
  const [synced, setSynced] = useState(false);
  const isRemoteUpdate = useRef(false);

  // ── Handle redirect result (mobile sign-in lands back here) ──
  useEffect(() => {
    getRedirectResult(auth).catch(console.error);
  }, []);

  // ── Listen for auth state changes ──
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
    });
    return () => unsubAuth();
  }, []);

  // ── Subscribe to Firestore once user is signed in ──
  useEffect(() => {
    if (!user) {
      setPortfolio(null);
      setSynced(false);
      return;
    }

    // Each user gets their own document keyed by UID
    const portfolioDoc = doc(db, 'portfolios', user.uid);

    const unsubSnapshot = onSnapshot(portfolioDoc, (snap) => {
      isRemoteUpdate.current = true;
      if (snap.exists()) {
        setPortfolio(snap.data().assets);
      } else {
        setDoc(portfolioDoc, { assets: INITIAL_PORTFOLIO });
        setPortfolio(INITIAL_PORTFOLIO);
      }
      setSynced(true);
    }, (err) => {
      console.error('Firestore error:', err);
      const saved = localStorage.getItem('portfolio_data_v4');
      setPortfolio(saved ? JSON.parse(saved) : INITIAL_PORTFOLIO);
      setSynced(true);
    });

    return () => unsubSnapshot();
  }, [user]);

  // ── Write to Firestore on local changes ──
  useEffect(() => {
    if (!portfolio || !user) return;
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }

    const portfolioDoc = doc(db, 'portfolios', user.uid);
    setDoc(portfolioDoc, { assets: portfolio });
    localStorage.setItem('portfolio_data_v4', JSON.stringify(portfolio));
  }, [portfolio, user]);

  const handleSignIn = () => {
    if (isMobile) {
      signInWithRedirect(auth, googleProvider).catch(console.error);
    } else {
      signInWithPopup(auth, googleProvider).catch(console.error);
    }
  };
  const handleSignOut = () => signOut(auth);

  const allDates = portfolio
    ? [...new Set(portfolio.flatMap(a => Object.keys(a.history || {})))].sort((a, b) => new Date(a) - new Date(b))
    : [];

  // --- State: checking auth ---
  if (user === undefined) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p className="text-secondary">Checking authentication…</p>
        </div>
      </div>
    );
  }

  // --- State: not signed in ---
  if (user === null) {
    return (
      <div className="app-container">
        <div className="login-screen">
          <div className="login-card glass-panel">
            <div className="login-logo">📈</div>
            <h1 className="login-title">FolioTrack</h1>
            <p className="login-subtitle text-secondary">
              Your personal portfolio analytics dashboard.<br />
              Sign in with Google to access your portfolio from any device.
            </p>
            <button className="btn-google" onClick={handleSignIn}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- State: loading data ---
  if (!synced) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p className="text-secondary">Loading your portfolio…</p>
        </div>
      </div>
    );
  }

  // --- State: authenticated + data loaded ---
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-brand">
          FolioTrack
          <span className="sync-indicator" title="Synced to cloud">☁️</span>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activePage === 'assets' ? 'active' : ''}`}
            onClick={() => setActivePage('assets')}
          >
            Manage Matrix
          </button>
        </nav>

        <div className="user-menu">
          <img src={user.photoURL} alt={user.displayName} className="user-avatar" title={user.displayName} />
          <button className="btn-signout" onClick={handleSignOut} title="Sign out">↩</button>
        </div>
      </header>

      <main>
        {activePage === 'dashboard' && (
          <Dashboard portfolio={portfolio} allDates={allDates} />
        )}
        {activePage === 'assets' && (
          <div className="portfolio-section slide-up">
            <div className="section-header">
              <h2>Hybrid Asset Matrix</h2>
              <p className="text-secondary">Track properties against timelines.</p>
            </div>
            <AssetList portfolio={portfolio} setPortfolio={setPortfolio} allDates={allDates} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
