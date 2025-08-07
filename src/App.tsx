import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AgentDashboard from './components/AgentDashboard';

function Tasks() {
  return <div className="p-4"><h1 className="text-xl font-bold">Tasks</h1></div>;
}

function Settings() {
  return <div className="p-4"><h1 className="text-xl font-bold">Settings</h1></div>;
}

export default function App() {
  return (
    <Router>
      <nav className="p-4 flex gap-4 border-b mb-4">
        <Link className="focus:outline-none focus:ring-2 focus:ring-blue-400" to="/agents">Agents</Link>
        <Link className="focus:outline-none focus:ring-2 focus:ring-blue-400" to="/tasks">Tasks</Link>
        <Link className="focus:outline-none focus:ring-2 focus:ring-blue-400" to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/agents" element={<AgentDashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
