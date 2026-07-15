import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';

// Simple Landing / Auth Placeholder View
const WelcomeScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4 text-center">
      <div className="max-w-md p-8 bg-white border border-neutral-200 rounded-lg shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
          Welcome to SnapPad
        </h1>
        <p className="text-neutral-500 mb-6">
          A minimalist, lightning-fast markdown workspace for your ideas.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
        >
          Open Workspace
        </Link>
      </div>
    </div>
  );
};

// Simple Dashboard Placeholder View
const DashboardScreen = () => {
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar Mock */}
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
          <Link to="/" className="text-red-500 hover:text-red-600">
            Sign Out
          </Link>
        </div>
      </div>
      {/* Editor Mock */}
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
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
      </Routes>
    </Router>
  );
}
