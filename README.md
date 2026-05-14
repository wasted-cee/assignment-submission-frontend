# Assignment Submission System - Frontend

React-based frontend for the school assignment submission system.

## Features

- User authentication (login/register)
- Student dashboard with assignment list
- Teacher dashboard for assignment management
- File submission interface
- Grading interface for teachers
- Responsive design

## Setup

### Prerequisites

- Node.js 16+
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional):
   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     - React components
├── contexts/       - React context for state management
├── services/       - API client
├── styles/         - CSS files
├── App.jsx         - Main app component
└── main.jsx        - Entry point
```

## License

MIT
