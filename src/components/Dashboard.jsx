import { useEffect, useState } from 'react';
import { assignmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

export const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsAPI.getAll();
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>
      <div className="assignments-list">
        {assignments.length === 0 ? (
          <p>No assignments available</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              <p className="deadline">Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
              <button onClick={() => window.location.href = `/assignment/${assignment.id}/submit`}>
                Submit Assignment
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const TeacherDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsAPI.getAll();
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentsAPI.create(formData);
      setFormData({ title: '', description: '', deadline: '' });
      setShowCreateForm(false);
      fetchAssignments();
    } catch (error) {
      console.error('Failed to create assignment', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Teacher Dashboard</h1>
      <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
        {showCreateForm ? 'Cancel' : 'Create Assignment'}
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreateAssignment} className="create-form">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="assignments-list">
        {assignments.length === 0 ? (
          <p>No assignments created</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              <p className="deadline">Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
              <button onClick={() => window.location.href = `/assignment/${assignment.id}/submissions`}>
                View Submissions
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
