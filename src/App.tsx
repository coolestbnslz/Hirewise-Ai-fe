import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/HR/DashboardPage';
import CreateJobPage from './pages/HR/CreateJobPage';
import JobDetailPage from './pages/HR/JobDetailPage';
import RecruiterDashboard from './pages/Recruiter/RecruiterDashboard';
import DebugDataPage from './pages/Debug/DebugDataPage';

import AgentPage from './pages/Public/AgentPage';
import ApplyPage from './pages/Public/ApplyPage';
import ScreeningPage from './pages/Public/ScreeningPage';

import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="hr/dashboard" element={<DashboardPage />} />
          <Route path="hr/create" element={<CreateJobPage />} />
          <Route path="hr/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="debug" element={<DebugDataPage />} />
        </Route>
        {/* Public routes outside layout or with different layout */}
        <Route path="/agent/:jobId" element={<AgentPage />} />
        <Route path="/agent/:jobId/apply" element={<ApplyPage />} />
        <Route path="/screening/:screeningId" element={<ScreeningPage />} />
      </Routes>
    </Router>
  );
}

export default App;
