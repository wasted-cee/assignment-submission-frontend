import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { submissionsAPI } from '../services/api';
import '../styles/Submission.css';

export const SubmissionPage = () => {
  const { assignmentId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      await submissionsAPI.submit(assignmentId, file);
      setSuccess(true);
      setFile(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submission-container">
      <h2>Submit Assignment</h2>
      {success && <div className="success-message">Assignment submitted successfully!</div>}
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="submission-form">
        <input
          type="file"
          onChange={handleFileChange}
          required
          accept=".pdf,.doc,.docx,.txt,.zip"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};
