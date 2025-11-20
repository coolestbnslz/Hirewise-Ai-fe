# HireWise Frontend

A professional-grade React frontend for HireWise, built with Vite, Tailwind CSS, and TypeScript.

## Features

- **HR Job Creation**: AI-assisted job posting with clarifying questions.
- **Public Agent Page**: High-conversion landing page for jobs.
- **Dynamic Application Form**: Generated based on job requirements.
- **Video Screening**: Integrated video recording for candidate screening.
- **Recruiter Dashboard**: Kanban-style application management.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  **Open the app**:
    Visit `http://localhost:5173` in your browser.

## Demo Walkthrough

1.  **Create a Job**:
    - Go to `/hr/create`.
    - Fill in the details. Try a short description to trigger clarifying questions.
    - Submit and view the enhanced JD.

2.  **Apply as a Candidate**:
    - Click "View Public Page" from the job details.
    - Click "Apply Now".
    - Fill out the form.
    - If selected for screening, you'll be redirected to the video recorder.

3.  **Recruiter Review**:
    - Go to `/recruiter/dashboard`.
    - View applications and their alignment scores.
    - Click a candidate to view details and approve/reject.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Hook Form + Zod
- Lucide React (Icons)
- Framer Motion (Animations)

## Environment Variables

- `VITE_API_BASE_URL`: URL of the backend API (default: `http://localhost:4000`)
