import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { submissionsAPI } from '../services/api';
import '../styles/GradingPage.css';

export const GradingPage = () => {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingData, setGradingData] = useState({});

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      const response = await submissionsAPI.getForAssignment(assignmentId);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to fetch submissions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      await submissionsAPI.grade(submissionId, grade, feedback);
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to grade submission', error);
    }
  };

  if (loading) return <div>Loading submissions...</div>;

  return (
    <div className="grading-container">
      <h2>Grade Submissions</h2>
      <div className="submissions-list">
        {submissions.length === 0 ? (
          <p>No submissions yet</p>
        ) : (
          submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <h4>{submission.name}</h4>
              <p>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</p>
              <a href={submission.file_path} target="_blank" rel="noopener noreferrer">Download File</a>
              <div className="grading-form">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Grade (0-100)"
                  defaultValue={submission.grade || ''}
                  onChange={(e) => setGradingData({ ...gradingData, [submission.id]: { ...gradingData[submission.id], grade: e.target.value } })}
                />
                <textarea
                  placeholder="Feedback"
                  defaultValue={submission.feedback || ''}
                  onChange={(e) => setGradingData({ ...gradingData, [submission.id]: { ...gradingData[submission.id], feedback: e.target.value } })}
                />
                <button onClick={() => {
                  const data = gradingData[submission.id] || {};
                  handleGrade(submission.id, data.grade, data.feedback);
                }}>Save Grade</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
