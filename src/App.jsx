import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import GetStartedHub from './pages/GetStartedHub'
import Workspace from './pages/Workspace'
import WorkspaceHome from './pages/WorkspaceHome'
import ToolWorkspace from './pages/ToolWorkspace'
import JobsLayout from './pages/jobs/JobsLayout'
import JobSearch from './pages/jobs/JobSearch'
import JobDetail from './pages/jobs/JobDetail'
import MyApplications from './pages/jobs/MyApplications'
import EmployeeProfileHub, { EmployeeApplicationsPanel } from './pages/jobs/EmployeeProfileHub'
import JobSeekerProfile from './pages/jobs/JobSeekerProfile'
import RecruiterProfileHub from './pages/jobs/RecruiterProfileHub'
import RecruiterProfileForm from './pages/jobs/RecruiterProfileForm'
import RecruiterApplicationDetail from './pages/jobs/RecruiterApplicationDetail'
import PostJob from './pages/jobs/PostJob'
import Login from './pages/Login'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/get-started" element={<GetStartedHub />} />
      <Route path="/get-started/ai" element={<Workspace />}>
        <Route index element={<WorkspaceHome />} />
        <Route path=":slug" element={<ToolWorkspace />} />
      </Route>
      <Route path="/get-started/jobs" element={<JobsLayout />}>
        <Route index element={<JobSearch />} />
        <Route path="job/:id" element={<JobDetail />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile" element={<EmployeeProfileHub />}>
          <Route index element={<JobSeekerProfile />} />
          <Route path="applications" element={<EmployeeApplicationsPanel />} />
        </Route>
        <Route path="recruiter" element={<Navigate to="/get-started/jobs/recruiter/jobs" replace />} />
        <Route path="recruiter/profile" element={<RecruiterProfileHub />}>
          <Route index element={<RecruiterProfileForm />} />
        </Route>
        <Route path="recruiter/jobs" element={<RecruiterProfileHub />} />
        <Route path="recruiter/applications" element={<RecruiterProfileHub />} />
        <Route path="recruiter/applications/:appId" element={<RecruiterApplicationDetail />} />
        <Route path="recruiter/post" element={<PostJob />} />
      </Route>
    </Routes>
  )
}

export default App
