import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AgentDetails from './components/AgentDetails';
import CommunicationCenter from './components/CommunicationCenter';
import ProjectManager from './components/ProjectManager';
import RestorePointManager from './components/RestorePointManager';
import Settings from './components/Settings';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Dashboard />} />
            <Route path="/agents/:agentId" element={<AgentDetails />} />
            <Route path="/communication" element={<CommunicationCenter />} />
            <Route path="/projects" element={<ProjectManager />} />
            <Route path="/restore" element={<RestorePointManager />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;