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
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedModal, setSelectedModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const assignmentsResponse = await assignmentsAPI.getAll();
      setAssignments(assignmentsResponse.data);

      // Fetch submissions for all assignments
      const allSubmissions = [];
      for (const assignment of assignmentsResponse.data) {
        try {
          const submissionsResponse = await submissionsAPI.getForAssignment(assignment.id);
          allSubmissions.push(...(submissionsResponse.data || []));
        } catch (error) {
          console.warn(`Could not fetch submissions for assignment ${assignment.id}:`, error);
        }
      }
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const isAssignmentActive = (deadline) => {
    return new Date(deadline) >= new Date();
  };

  const getFilteredAndSortedAssignments = () => {
    let filtered = assignments;

    if (filterStatus === 'active') {
      filtered = filtered.filter(a => isAssignmentActive(a.deadline));
    } else if (filterStatus === 'ended') {
      filtered = filtered.filter(a => !isAssignmentActive(a.deadline));
    }

    let sorted = [...filtered];
    if (sortBy === 'deadline') {
      sorted.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === 'created') {
      sorted.sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id));
    } else if (sortBy === 'submissions') {
      sorted.sort((a, b) => {
        const aCount = getSubmissionCountForAssignment(b.id);
        const bCount = getSubmissionCountForAssignment(a.id);
        return aCount - bCount;
      });
    }

    return sorted;
  };

  const getSubmissionCountForAssignment = (assignmentId) => {
    return submissions.filter(s => s.assignmentId === assignmentId).length;
  };

  const getStatistics = () => {
    const total = assignments.length;
    const active = assignments.filter(a => isAssignmentActive(a.deadline)).length;
    const ended = total - active;
    const totalSubmissions = submissions.length;
    const graded = submissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    const pending = totalSubmissions - graded;

    return { total, active, ended, totalSubmissions, graded, pending };
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await assignmentsAPI.update(editingId, formData);
        setEditingId(null);
      } else {
        await assignmentsAPI.create(formData);
      }
      setFormData({ title: '', description: '', deadline: '' });
      setShowCreateForm(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
      fetchData();
    } catch (error) {
      console.error('Failed to save assignment', error);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentsAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete assignment', error);
      }
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingId(assignment.id);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline.slice(0, 16)
    });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingId(null);
    setFormData({ title: '', description: '', deadline: '' });
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

  if (loading) return <div className="loading">Loading...</div>;

  const stats = getStatistics();
  const filteredAssignments = getFilteredAndSortedAssignments();

  return (
    <div className="dashboard">
      <h1>Teacher Dashboard</h1>

      {/* Statistics Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.ended}</div>
          <div className="stat-label">Ended</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSubmissions}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.graded}</div>
          <div className="stat-label">Graded</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Grading</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          {showCreateForm ? 'Cancel' : '+ Create Assignment'}
        </button>
      </div>

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="confirmation-message">
          ✓ {editingId ? 'Assignment updated' : 'Assignment created'} successfully!
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateAssignment} className="create-form">
          <h3>{editingId ? 'Edit Assignment' : 'Create New Assignment'}</h3>
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
          <div className="form-buttons">
            <button type="submit" className="btn-save">
              {editingId ? 'Update Assignment' : 'Create Assignment'}
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter and Sort Controls */}
      <div className="controls-bar">
        <div className="control-group">
          <label htmlFor="filterStatus">Filter by Status:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="control-select"
          >
            <option value="all">All Assignments</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sortBy">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="control-select"
          >
            <option value="deadline">Deadline (nearest first)</option>
            <option value="created">Creation Date (newest first)</option>
            <option value="submissions">Submission Count</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="assignments-list">
        {filteredAssignments.length === 0 ? (
          <p className="no-data">
            {assignments.length === 0 
              ? 'No assignments created yet.' 
              : 'No assignments match the selected filters.'}
          </p>
        ) : (
          filteredAssignments.map((assignment) => {
            const submissionCount = getSubmissionCountForAssignment(assignment.id);
            const isActive = isAssignmentActive(assignment.deadline);

            return (
              <div key={assignment.id} className="assignment-card teacher-card">
                <div className="card-header">
                  <div>
                    <h3>{assignment.title}</h3>
                    <span className={`status-badge ${isActive ? 'badge-active' : 'badge-ended'}`}>
                      {isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn-icon btn-view"
                      onClick={() => setSelectedModal(assignment.id)}
                      title="View details"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEditAssignment(assignment)}
                      title="Edit assignment"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      title="Delete assignment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p className="description">{assignment.description}</p>

                <p className={`deadline ${!isActive ? 'overdue' : ''}`}>
                  📅 Deadline: {formatDate(assignment.deadline)}
                </p>

                <div className="submission-stats">
                  <div className="stat-item">
                    <span className="stat-count">{submissionCount}</span>
                    <span className="stat-text">Submission{submissionCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <button
                  onClick={() => window.location.href = `/assignment/${assignment.id}/submissions`}
                  className="btn-view-submissions"
                >
                  View Submissions ({submissionCount})
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedModal && (
        <div className="modal-overlay" onClick={() => setSelectedModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {assignments.map(a => a.id === selectedModal ? (
              <div key={a.id}>
                <div className="modal-header">
                  <h2>{a.title}</h2>
                  <button className="modal-close" onClick={() => setSelectedModal(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="modal-section">
                    <h4>Description</h4>
                    <p>{a.description}</p>
                  </div>
                  <div className="modal-section">
                    <h4>Deadline</h4>
                    <p>{formatDate(a.deadline)}</p>
                  </div>
                  <div className="modal-section">
                    <h4>Assignment Status</h4>
                    <p>
                      <span className={`status-badge ${isAssignmentActive(a.deadline) ? 'badge-active' : 'badge-ended'}`}>
                        {isAssignmentActive(a.deadline) ? 'Active' : 'Ended'}
                      </span>
                    </p>
                  </div>
                  <div className="modal-section">
                    <h4>Submission Statistics</h4>
                    <div className="submission-breakdown">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Total Submissions:</span>
                        <span className="breakdown-value">{getSubmissionCountForAssignment(a.id)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Graded:</span>
                        <span className="breakdown-value">
                          {submissions.filter(s => s.assignmentId === a.id && s.grade !== null && s.grade !== undefined).length}
                        </span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Pending Grading:</span>
                        <span className="breakdown-value">
                          {submissions.filter(s => s.assignmentId === a.id && (s.grade === null || s.grade === undefined)).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    onClick={() => window.location.href = `/assignment/${a.id}/submissions`}
                    className="btn-primary"
                  >
                    View All Submissions
                  </button>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
};