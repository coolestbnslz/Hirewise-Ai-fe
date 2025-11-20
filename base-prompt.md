Project: HireWise Frontend (React + TypeScript + Vite + Tailwind)

Goal:x
Generate a polished, hackathon-ready React frontend that integrates with the HireWise backend. The UI should let HR post raw JDs (and answer clarifying questions), show the enhanced/finalized JD, create agents, let candidates apply via a dynamic form, record/upload video screening answers, and let recruiters review candidate cards and send/see invites. Focus on clear UX, demo polish, and easy wiring to the backend. Keep code modular and well-documented with TODOs where needed.

Tech stack & tools:
- React + TypeScript
- Vite for dev build
- Tailwind CSS for styling
- React Router for client routing
- React Query (optional) or simple fetch wrapper for API calls
- useContext for global state (auth-lite) or minimal state management
- MediaRecorder API for video recording in-browser
- Testing: Jest + React Testing Library for 2–3 core tests
- Optional: headlessui/shadcn components (mention as optional in README)

Deliverables (files & structure):
- package.json, tsconfig.json, vite.config.ts, tailwind.config.js
- public/ (favicon + index.html)
- src/
  - main.tsx (app entry)
  - App.tsx (routes)
  - api/
    - apiClient.ts (fetch wrapper reading BASE_API_URL from env)
    - jobs.ts (functions: postJob, getJob, clarifyJob, updateSettings)
    - apply.ts (applyToJob)
    - applications.ts (approveLevel1)
    - screenings.ts (uploadVideo, processVideo)
  - hooks/
    - useJobs.ts
    - useApplications.ts
  - pages/
    - HR/
      - CreateJobPage.tsx — form to POST /api/jobs (raw_jd, role...), shows clarifying questions if returned, allows answering and finalizing
      - JobDetailPage.tsx — shows draft/final enhanced JD, tags, apply form fields and settings (patch settings)
      - DashboardPage.tsx — list of jobs and quick links
    - Public/
      - AgentPage.tsx — public agent page `/agent/:jobId` with job summary, chat widget (optional), Apply CTA
      - ApplyPage.tsx — dynamic form generated from job.apply_form_fields; resume upload; submit to POST /api/apply/:jobId; show immediate alignment_score and optional screening link returned
    - Recruiter/
      - RecruiterDashboard.tsx — list of applications for a job with filters (score, tags)
      - CandidateCard.tsx — shows resume snippet, alignment score, tags, screening status, per-question video highlights (if present), buttons: Invite / Approve / Reject
      - ScreeningModal.tsx — record video (3 questions flow), preview, upload (or external videoUrl), call backend upload endpoint
    - Debug/
      - DebugDataPage.tsx — shows /debug endpoints for jobs, applications, screenings (for demo)
  - components/
    - FormFieldRenderer.tsx — render dynamic form fields from apply_form_fields
    - Recorder.tsx — MediaRecorder UI with countdown, time limit, re-record, preview, upload handler
    - TagList.tsx, ScoreBadge.tsx, ConfirmModal.tsx, Toast.tsx
  - styles/
    - index.css (Tailwind imports)
  - utils/
    - validators.ts (simple)
    - format.ts
- tests/
  - CreateJobPage.test.tsx (simulate posting a JD and receiving clarifying questions; mock api.jobs.postJob)
  - ApplyPage.test.tsx (render dynamic form and submit; mock apply endpoint)
- .env.example (VITE_API_BASE_URL)
- README.md (how to run, env, curl examples, where to wire real OpenAI keys on backend, media constraints, consent wording)

Functional requirements & UX details
1. **HR Create Job flow**
   - Page: `/hr/create`
   - Form fields: company_name, role, seniority, raw_jd (textarea), budget_info, must_have_skills, nice_to_have
   - On submit: call `POST /api/jobs` and show response.
     - If response includes `clarifying_questions`, show them in a modal or inline form with reason text and allow HR to fill answers. Submit answers to `POST /api/jobs/:id/clarify`.
     - After finalization, show enhanced_jd and generated tags/form fields. Allow editing and patch settings (toggles for autoInviteOnLevel1Approval, thresholds).
   - Provide small UX copy explaining LLM may ask clarifying Qs (max 6), show loading spinners, and show raw LLM response link for demo (toggle).

2. **Public Agent & Apply flow**
   - Public page: `/agent/:jobId`
   - Show job short_blurb, tags, short enhanced_jd. CTA: Apply.
   - Apply page: dynamic render of fields from apply_form_fields (FormFieldRenderer).
   - Resume upload via file input (multipart). On submit call `POST /api/apply/:jobId`. Show immediate toast: "Resume received — scoring in progress".
   - Display returned `alignmentScore` (if present) and `autoScreeningId` if created. If screening created, show link to record/submit video.

3. **Recorder & Screening**
   - Component `Recorder.tsx`:
     - Show the question text (rotate 3 questions), countdown to start, per-question time limit, record controls (start/stop), preview, re-record.
     - After recording, allow upload to backend via `/api/screenings/:id/upload-video` (send `videoUrl` or file).
     - For simplicity allow candidate to paste `videoUrl` (mock hosting) or implement upload to backend which stores locally.
   - UI must clearly show consent checkbox before recording.

4. **Recruiter Dashboard & Candidate Card**
   - Recruiter sees list of applications with alignmentScore, tags, status.
   - Clicking candidate opens CandidateCard modal showing:
     - Resume snippet (first 300 chars), tags auto-extracted, alignmentScore, video transcript snippet (if available), LLM two_line_summary, per-question scores.
     - Buttons: Approve Level-1 (calls `/api/applications/:id/approve-level1`), Invite now (calls email generation backend if not auto-sent), Download resume.
   - Approve-level1 should show confirm modal with options for auto-send (if job settings allow).

5. **Debug & Demo helpers**
   - Debug page shows raw responses from `/debug/jobs`, `/debug/applications`, `/debug/screenings`.
   - Provide ability to prefill forms with demo job id provided in README.

API integration & wiring
- Central API client: `src/api/apiClient.ts` reads `VITE_API_BASE_URL` from env and exposes helper `get/post/patch` that attaches JSON headers and handles 401/logging.
- Each API file (jobs.ts, apply.ts, applications.ts, screenings.ts) exports clear functions used in pages.
- All API calls should handle network errors and show user-friendly toasts.
- Use `fetch` (native) or optional axios. Keep minimal deps.

Accessibility & responsiveness
- Responsive layout (mobile-first) and keyboard accessible forms.
- Recorder should warn if MediaRecorder not supported.

Design & Styling
- Use Tailwind for quick polished UI.
- Provide a simple color palette and make CandidateCard visually clear (badges for scores, green/yellow/red for thresholds).
- Keep components small and reusable.

Testing
- Use Jest + React Testing Library
- Mock API calls using jest.mock or msw for the most important page flows:
  - JD enhancement clarifying flow
  - Apply page dynamic form submission
- Provide instructions to run tests in README.

README content (must include)
- Project purpose & quick demo steps
- Install & run:
  - `npm install`
  - `npm run dev`
- ENV: VITE_API_BASE_URL (e.g., http://localhost:4000)
- How to demo:
  - Step 1: Open /hr/create and post example JD (include sample JD)
  - Step 2: Visit /agent/:demoJobId and apply using resume.txt
  - Step 3: For high alignment score the screening will be auto-created — record or paste a videoUrl
  - Step 4: Admin dashboard -> approve level1 to auto-send invite
- Notes: Where to wire real LLM keys (backend), privacy & consent before recording, and limitations for hackathon.

Acceptance criteria (what I will check)
1. `npm run dev` starts the app and routes work.
2. HR Create Job flow returns clarifying questions when LLM mock does so; HR can answer and finalize JD.
3. Public apply page dynamically renders fields returned from job.apply_form_fields.
4. Recorder records short clips in supported browsers and allows preview + upload.
5. Recruiter Dashboard lists applications and candidate card shows score + screening info.

Developer tone & TODOs in generated code
- Add TODO comments where backend URLs or provider keys must be set.
- Provide clear console logs for API errors and raw LLM responses (only for demo).
- Keep UI copy concise and user-friendly.

Return
- Provide the generated repo tree and code for files listed above, or if generating everything is too large, at minimum produce:
  - `src/pages/HR/CreateJobPage.tsx`
  - `src/pages/Public/ApplyPage.tsx`
  - `src/components/Recorder.tsx`
  - `src/api/apiClient.ts`
  - `src/api/jobs.ts`
  - `src/components/FormFieldRenderer.tsx`
  - `README.md`