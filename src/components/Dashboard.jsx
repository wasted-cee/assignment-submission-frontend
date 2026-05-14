import { useEffect, useState } from 'react';
import { assignmentsAPI, submissionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

export const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch available assignments
      const assignmentsResponse = await assignmentsAPI.getAll();
      const sortedAssignments = assignmentsResponse.data.sort((a, b) => 
        new Date(a.deadline) - new Date(b.deadline)
      );
      setAssignments(sortedAssignments);

      // Fetch user submissions if user exists
      if (user?.id) {
        try {
          const submissionsResponse = await submissionsAPI.getUserSubmissions(user.id);
          setSubmissions(submissionsResponse.data || []);
        } catch (error) {
          console.warn('Could not fetch submissions:', error);
          setSubmissions([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const isLateSubmission = (submission, assignment) => {
    if (!submission.submittedAt) return false;
    return new Date(submission.submittedAt) > new Date(assignment.deadline);
  };

  const getSubmissionStatus = (submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      return 'graded';
    }
    return submission.submittedAt ? 'submitted' : 'pending';
  };

  const getStatusBadgeClass = (status, isLate) => {
    if (status === 'graded') return 'badge-graded';
    if (status === 'submitted' && isLate) return 'badge-late';
    if (status === 'submitted') return 'badge-submitted';
    return 'badge-pending';
  };

  const getStatusLabel = (status, isLate) => {
    if (status === 'graded') return 'Graded';
    if (status === 'submitted' && isLate) return '⚠ Late Submission';
    if (status === 'submitted') return 'Submitted';
    return 'Pending';
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(sub => sub.assignmentId === assignmentId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available Assignments
        </button>
        <button 
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          My Submissions ({submissions.length})
        </button>
      </div>

      {/* Available Assignments Tab */}
      {activeTab === 'available' && (
        <div className="tab-content">
          <h2>Available Assignments</h2>
          <div className="assignments-list">
            {assignments.length === 0 ? (
              <p className="no-data">No assignments available</p>
            ) : (
              assignments.map((assignment) => {
                const submission = getSubmissionForAssignment(assignment.id);
                const status = submission ? getSubmissionStatus(submission) : 'pending';
                const isLate = submission && isLateSubmission(submission, assignment);
                const deadlinePassed = isDeadlinePassed(assignment.deadline);

                return (
                  <div key={assignment.id} className="assignment-card">
                    <div className="card-header">
                      <h3>{assignment.title}</h3>
                      {submission && (
                        <span className={`status-badge ${getStatusBadgeClass(status, isLate)}`}>
                          {getStatusLabel(status, isLate)}
                        </span>
                      )}
                    </div>
                    <p className="description">{assignment.description}</p>
                    <p className={`deadline ${deadlinePassed ? 'overdue' : ''}`}>
                      📅 Deadline: {formatDate(assignment.deadline)}
                      {deadlinePassed && <span className="overdue-label"> (OVERDUE)</span>}
                    </p>
                    
                    {submission && (
                      <div className="submission-info">
                        <p className="submission-date">
                          📤 Submitted: {formatDate(submission.submittedAt)}
                          {isLate && <span className="late-warning"> (Late)</span>}
                        </p>
                        {submission.grade !== null && submission.grade !== undefined && (
                          <p className="grade">
                            ⭐ Grade: <strong>{submission.grade}</strong>
                          </p>
                        )}
                        {submission.feedback && (
                          <div className="feedback">
                            <p className="feedback-label">📝 Feedback:</p>
                            <p className="feedback-text">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      onClick={() => window.location.href = `/assignment/${assignment.id}/submit`}
                      className={`submit-button ${submission ? 'resubmit' : ''}`}
                    >
                      {submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="tab-content">
          <h2>My Submissions</h2>
          <div className="submissions-list">
            {submissions.length === 0 ? (
              <p className="no-data">No submissions yet</p>
            ) : (
              submissions.map((submission) => {
                const assignment = assignments.find(a => a.id === submission.assignmentId);
                const status = getSubmissionStatus(submission);
                const isLate = isLateSubmission(submission, assignment);

                return (
                  <div key={submission.id} className="submission-card">
                    <div className="card-header">
                      <h3>{assignment?.title || 'Assignment'}</h3>
                      <span className={`status-badge ${getStatusBadgeClass(status, isLate)}`}>
                        {getStatusLabel(status, isLate)}
                      </span>
                    </div>

                    <div className="submission-details">
                      <div className="detail-row">
                        <span className="detail-label">📤 Submission Date:</span>
                        <span className="detail-value">{formatDate(submission.submittedAt)}</span>
                      </div>

                      {assignment && (
                        <div className="detail-row">
                          <span className="detail-label">📅 Deadline:</span>
                          <span className={`detail-value ${isDeadlinePassed(assignment.deadline) ? 'overdue' : ''}`}>
                            {formatDate(assignment.deadline)}
                            {isLate && <span className="late-warning"> (Late by {Math.ceil((new Date(submission.submittedAt) - new Date(assignment.deadline)) / (1000 * 60 * 60 * 24))} days)</span>}
                          </span>
                        </div>
                      )}

                      {submission.grade !== null && submission.grade !== undefined && (
                        <div className="detail-row">
                          <span className="detail-label">⭐ Grade:</span>
                          <span className="detail-value grade-value">{submission.grade}</span>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="detail-row feedback-section">
                          <span className="detail-label">📝 Feedback:</span>
                          <p className="feedback-text">{submission.feedback}</p>
                        </div>
                      )}

                      {!submission.grade && (
                        <p className="pending-grade">⏳ Awaiting grading...</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
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

  if (loading) return <div className="loading">Loading...</div>;

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