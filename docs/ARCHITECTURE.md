# HireWise AI - System Architecture

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        HR[HR Dashboard]
        Candidate[Candidate Portal]
    end

    subgraph "API Layer - Express.js"
        JobsAPI[Jobs API<br/>/api/jobs]
        ApplicationsAPI[Applications API<br/>/api/applications]
        UsersAPI[Users API<br/>/api/users]
        ScreeningsAPI[Screenings API<br/>/api/screenings]
        AnalysisAPI[Analysis API<br/>/api/analysis]
        EmailAPI[Email API<br/>/api/email]
    end

    subgraph "Business Logic Layer"
        JDEnhancer[JD Enhancer]
        CandidateMatcher[Candidate Matcher]
        ResumeParser[Resume Parser]
        ScoreCalculator[Score Calculator]
    end

    subgraph "AI/LLM Services"
        BedrockAPI[Amazon Bedrock API<br/>Claude 3.5 Sonnet/Opus]
        EmbeddingsAPI[Titan Embeddings]
        BlandAI[Bland AI<br/>Voice Interviews]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>Primary Database)]
        S3[(AWS S3<br/>Resume Storage)]
    end

    subgraph "External Services"
        GitHubAPI[GitHub API<br/>Profile Analysis]
        Mailgun[Mailgun<br/>Email Service]
    end

    subgraph "Data Models"
        JobModel[Job Model]
        UserModel[User Model]
        ApplicationModel[Application Model]
        ScreeningModel[Screening Model]
        MatchModel[JobCandidateMatch Model]
        SearchModel[CandidateSearch Model]
    end

    %% Client to API connections
    HR --> JobsAPI
    HR --> ApplicationsAPI
    HR --> UsersAPI
    HR --> ScreeningsAPI
    HR --> AnalysisAPI
    HR --> EmailAPI
    Candidate --> ApplicationsAPI

    %% API to Business Logic
    JobsAPI --> JDEnhancer
    JobsAPI --> CandidateMatcher
    ApplicationsAPI --> ResumeParser
    ApplicationsAPI --> ScoreCalculator
    UsersAPI --> CandidateMatcher
    ScreeningsAPI --> ScoreCalculator

    %% Business Logic to AI Services
    JDEnhancer --> BedrockAPI
    CandidateMatcher --> BedrockAPI
    CandidateMatcher --> EmbeddingsAPI
    ResumeParser --> BedrockAPI
    ScoreCalculator --> BedrockAPI
    ApplicationsAPI --> BlandAI
    UsersAPI --> BlandAI

    %% API to External Services
    ApplicationsAPI --> GitHubAPI
    UsersAPI --> GitHubAPI
    EmailAPI --> Mailgun
    ApplicationsAPI --> Mailgun
    UsersAPI --> Mailgun

    %% API to Data Layer
    JobsAPI --> MongoDB
    ApplicationsAPI --> MongoDB
    UsersAPI --> MongoDB
    ScreeningsAPI --> MongoDB
    ApplicationsAPI --> S3
    UsersAPI --> S3

    %% Data Models
    MongoDB --> JobModel
    MongoDB --> UserModel
    MongoDB --> ApplicationModel
    MongoDB --> ScreeningModel
    MongoDB --> MatchModel
    MongoDB --> SearchModel

    %% Webhooks
    BlandAI -.->|Webhook| ApplicationsAPI
    BlandAI -.->|Webhook| UsersAPI

    style BedrockAPI fill:#ff6b6b
    style BlandAI fill:#4ecdc4
    style MongoDB fill:#45b7d1
    style S3 fill:#f9ca24
    style Mailgun fill:#6c5ce7
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "Request Flow"
        A[HTTP Request] --> B[Express Middleware]
        B --> C[Route Handler]
        C --> D{Business Logic}
    end

    subgraph "Core Services"
        D --> E[LLM Service]
        D --> F[Storage Service]
        D --> G[Email Service]
        D --> H[GitHub Service]
        D --> I[Bland AI Service]
    end

    subgraph "Data Persistence"
        E --> J[(MongoDB)]
        F --> K[(S3)]
        F --> J
    end

    subgraph "External APIs"
        E --> L[Bedrock API]
        G --> M[Mailgun API]
        H --> N[GitHub API]
        I --> O[Bland AI API]
    end

    subgraph "Response"
        J --> P[Format Response]
        K --> P
        L --> P
        M --> P
        N --> P
        O --> P
        P --> Q[HTTP Response]
    end
```

## Data Flow Diagrams

### Job Creation & Candidate Matching Flow

```mermaid
sequenceDiagram
    participant HR as HR User
    participant API as Jobs API
    participant LLM as Bedrock LLM
    participant DB as MongoDB
    participant Matcher as Candidate Matcher

    HR->>API: POST /api/jobs (Create Job)
    API->>LLM: Enhance JD & Extract Tags
    LLM-->>API: Enhanced JD + Tags
    API->>DB: Save Job
    API->>Matcher: Find Matching Candidates
    Matcher->>DB: Query Users (not hired)
    Matcher->>LLM: Calculate Match Scores
    LLM-->>Matcher: Scores & Analysis
    Matcher->>DB: Save JobCandidateMatch
    API-->>HR: Job Created + Matches
```

### Application & Scoring Flow

```mermaid
sequenceDiagram
    participant Candidate
    participant API as Applications API
    participant Storage as S3/Storage
    participant LLM as Bedrock LLM
    participant GitHub as GitHub API
    participant DB as MongoDB

    Candidate->>API: POST /api/apply/:jobId (Resume)
    API->>Storage: Upload Resume to S3
    Storage-->>API: S3 URL
    API->>DB: Create Application (immediate response)
    API-->>Candidate: Application Submitted
    
    Note over API: Async Processing Starts
    API->>Storage: Extract Resume Text
    API->>LLM: Parse Resume (structured)
    LLM-->>API: Parsed Resume Data
    API->>LLM: Extract Tags & Summary
    LLM-->>API: Tags & Summary
    API->>GitHub: Fetch Profile Data
    GitHub-->>API: Repositories & Profile
    API->>LLM: Score Resume
    API->>LLM: Score GitHub/Portfolio
    API->>LLM: Analyze Compensation
    LLM-->>API: All Scores
    API->>DB: Update Application with Scores
```

### Phone Interview Flow

```mermaid
sequenceDiagram
    participant HR as HR User
    participant API as Applications/Users API
    participant BlandAI as Bland AI
    participant Candidate
    participant DB as MongoDB

    HR->>API: POST /schedule-call (userId/applicationId)
    API->>DB: Get User/Application
    API->>LLM: Generate Questions
    LLM-->>API: Interview Questions
    API->>BlandAI: Initiate Call (with questions)
    BlandAI-->>API: Call ID
    API->>DB: Store Call Info
    API->>Mailgun: Send Email Notification
    API-->>HR: Call Scheduled
    
    BlandAI->>Candidate: Make Phone Call
    Candidate->>BlandAI: Answer Questions
    BlandAI->>LLM: Transcribe & Analyze
    LLM-->>BlandAI: Transcript & Analysis
    BlandAI->>API: Webhook (Call Complete)
    API->>DB: Update Call Summary
    API-->>HR: Call Results Available
```

### Candidate Search Flow

```mermaid
sequenceDiagram
    participant HR as HR User
    participant API as Users API
    participant LLM as Bedrock LLM
    participant DB as MongoDB

    HR->>API: POST /api/users/search (Natural Language)
    API->>LLM: Extract Search Criteria
    LLM-->>API: Structured Criteria
    API->>DB: Query Users (with filters)
    DB-->>API: Candidate Results
    
    loop For Each Candidate
        API->>LLM: Score Candidate
        LLM-->>API: Match Score & Analysis
        API->>GitHub: Fetch GitHub Data (if available)
        GitHub-->>API: Profile Data
        API->>LLM: Score GitHub/Portfolio
        LLM-->>API: GitHub Score
    end
    
    API->>DB: Save Search Results
    API-->>HR: Scored Candidates + Search ID
```

## Database Schema Relationships

```mermaid
erDiagram
    Job ||--o{ Application : "has"
    User ||--o{ Application : "applies"
    Job ||--o{ JobCandidateMatch : "matches"
    User ||--o{ JobCandidateMatch : "matched"
    Application ||--o| Screening : "has"
    User ||--o{ CandidateSearch : "found_in"
    Application ||--o| JobCandidateMatch : "linked_to"

    Job {
        ObjectId _id
        string company_name
        string role
        string enhanced_jd
        array must_have_skills
        array nice_to_have
        string budget_info
        array tags
    }

    User {
        ObjectId _id
        string email
        string name
        string phone
        string resumeS3Url
        string resumeText
        object parsedResume
        array tags
        array phoneInterviewSummaries
    }

    Application {
        ObjectId _id
        ObjectId jobId
        ObjectId userId
        number unifiedScore
        object scores
        array skillsMatched
        boolean level1_approved
        object phoneInterview
    }

    JobCandidateMatch {
        ObjectId _id
        ObjectId jobId
        ObjectId userId
        number matchScore
        string status
    }

    Screening {
        ObjectId _id
        ObjectId applicationId
        string videoUrl
        object scoring
    }

    CandidateSearch {
        ObjectId _id
        string searchText
        array shortlistedUsers
        array rejectedUsers
    }
```

## Technology Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: AWS S3

### AI/ML Services
- **LLM**: Amazon Bedrock (Claude 3.5 Sonnet, Opus, Haiku)
- **Embeddings**: Amazon Bedrock Titan Embeddings
- **Voice AI**: Bland AI (Phone Interviews)

### External Services
- **Email**: Mailgun API
- **Version Control**: GitHub API (for profile analysis)

### Key Libraries
- `mongoose` - MongoDB ODM
- `@aws-sdk/client-s3` - S3 integration
- `@aws-sdk/s3-request-presigner` - Presigned URLs
- `pdf-parse` - PDF text extraction
- `mailgun.js` - Email service
- `multer` - File upload handling

## Key Features & Endpoints

### Job Management
- `POST /api/jobs` - Create job with JD enhancement
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/extract-fields` - Extract job fields from text

### Application Management
- `POST /api/apply/:jobId` - Submit application (async scoring)
- `GET /api/applications/job/:jobId` - Get all applications for a job
- `POST /api/applications/:id/approve-level1` - Approve candidate
- `POST /api/applications/:id/reject` - Reject candidate
- `POST /api/applications/:id/schedule-call` - Schedule phone interview

### User Management
- `GET /api/users/:id` - Get user profile
- `POST /api/users/search` - AI-powered candidate search
- `POST /api/users/:userId/schedule-call` - Schedule call (no application)
- `GET /api/users/:id/resume` - Download resume (presigned URL)

### Phone Interviews
- `POST /api/applications/:id/schedule-call` - Schedule/initiate call
- `GET /api/applications/:id/phone-call-status` - Get call status
- `POST /api/applications/:id/webhook` - Bland AI webhook handler

### Email Service
- `POST /api/email/send` - Send single email
- `POST /api/email/send-bulk` - Send bulk emails

## Security & Best Practices

1. **Environment Variables**: All sensitive data stored in `.env`
2. **Presigned URLs**: Secure S3 file access with expiration
3. **Input Validation**: Request validation and sanitization
4. **Error Handling**: Comprehensive error handling middleware
5. **Async Processing**: Heavy LLM operations run asynchronously
6. **Null Safety**: Null checks for all database references

## Deployment Considerations

- **Database**: MongoDB Atlas or self-hosted
- **Storage**: AWS S3 (configurable region)
- **API**: Railway, Heroku, AWS EC2, or similar
- **Environment**: Production `.env` with all required keys
- **Webhooks**: Public URL required for Bland AI callbacks (ngrok for local dev)
