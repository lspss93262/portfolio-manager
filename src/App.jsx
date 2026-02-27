import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';

// Initial Mock Data to see the UI in action with the Hybrid Matrix structure
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
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'assets'
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio_data_v4');
    if (saved) return JSON.parse(saved);
    return INITIAL_PORTFOLIO;
  });

  useEffect(() => {
    localStorage.setItem('portfolio_data_v4', JSON.stringify(portfolio));
  }, [portfolio]);

  // Derive unique dates for the dashboard to know what's available
  const allDates = [...new Set(portfolio.flatMap(asset => Object.keys(asset.history || {})))].sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-brand">FolioTrack</div>

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
