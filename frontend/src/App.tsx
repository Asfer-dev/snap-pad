// frontend/src/App.tsx
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthGateway } from './components/AuthGateway';

// Simple Dashboard Placeholder View for now (Next Issues will replace this!)
const DashboardScreen = () => {
  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="w-64 border-r border-neutral-200 bg-white p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 mb-4">SnapPad</h2>
          <div className="space-y-1">
            <div className="text-sm px-2 py-1.5 rounded bg-blue-50 text-blue-700 font-medium">
              📄 Quick Start Note
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-sm text-neutral-500">
          <span>👤 User</span>
          <Link
            to="/"
            onClick={() => localStorage.removeItem('token')}
            className="text-red-500 hover:text-red-600"
          >
            Sign Out
          </Link>
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col items-center">
        <div className="max-w-2xl w-full">
          <div className="text-xs text-neutral-400 mb-2">My Workspace &gt; Quick Start</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Quick Start Note</h1>
          <p className="text-neutral-600">Start writing something amazing...</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
      </Routes>
    </Router>
  );
}
