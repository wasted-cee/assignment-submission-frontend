import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm } from './components/AuthForms';
import { StudentDashboard, TeacherDashboard } from './components/Dashboard';
import { SubmissionPage } from './components/SubmissionPage';
import { GradingPage } from './components/GradingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';
import './styles/App.css';

function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
}

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">Assignment System</div>
      <div className="nav-right">
        <span>{user.name} ({user.role})</span>
        <button onClick={() => {
          logout();
          navigate('/login');
        }}>Logout</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/assignment/:assignmentId/submit" element={
            <ProtectedRoute requiredRole="student">
              <SubmissionPage />
            </ProtectedRoute>
          } />
          <Route path="/assignment/:assignmentId/submissions" element={
            <ProtectedRoute requiredRole="teacher">
              <GradingPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
