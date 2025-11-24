import { request } from './apiClient';
import { type CandidateProfile } from './search';

export interface Application {
    id: string;
    applicationId?: string;
    userId?: string;
    jobId: string;
    candidateName: string;
    email: string;
    phone?: string;
    alignmentScore: number;
    status: 'new' | 'level1_approved' | 'invited' | 'rejected' | { consentGiven?: boolean; level1Approved?: boolean;[key: string]: any };
    tags: string[];
    resumePreview?: string;
    screeningId?: string;
    currentCompany?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    location?: string;
    education?: string;
    currentRole?: string;
    // API response structure
    candidate?: CandidateProfile;
    scores?: {
        resumeScore?: number;
        githubPortfolioScore?: number | null;
        compensationScore?: number | null;
        unifiedScore?: number;
        compensationAnalysis?: any;
    };
    matchInfo?: any;
    // Additional fields for UI
    parsedResume?: CandidateProfile['parsedResume'];
    phoneInterviewSummaries?: any[]; // Phone interview summaries from API
}

// Helper function to format status for display
export const formatApplicationStatus = (status: Application['status']): string => {
    if (typeof status === 'string') {
        return status;
    }
    if (typeof status === 'object' && status !== null) {
        if (status.level1Approved) {
            return 'level1_approved';
        }
        if (status.consentGiven) {
            return 'new';
        }
        return 'new';
    }
    return 'new';
}

export interface GetApplicationsByJobParams {
    status?: string;
    minScore?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export const applicationsApi = {
    list: async (jobId?: string) => {
        // Using debug endpoint to get all applications
        let allApplications: Application[] = [];
        try {
            allApplications = await request<Application[]>('/debug/applications');
        } catch (error) {
            console.warn('Failed to fetch applications, using mock data only', error);
        }

        // Add dummy data for demonstration
        const dummyApplications: Application[] = [
            {
                id: 'mock_1',
                jobId: 'job_123',
                candidateName: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                alignmentScore: 92,
                status: 'new',
                tags: ['React', 'Node.js', 'Senior'],
                resumePreview: 'Senior Full Stack Developer with 6 years of experience in MERN stack. Led a team of 5 developers at a fintech startup.',
                screeningId: 'screen_1'
            },
            {
                id: 'mock_2',
                jobId: 'job_123',
                candidateName: 'Priya Patel',
                email: 'priya.p@example.com',
                alignmentScore: 78,
                status: 'level1_approved',
                tags: ['Frontend', 'UI/UX', 'Figma'],
                resumePreview: 'Creative Frontend Developer passionate about pixel-perfect UIs. Strong background in design systems and accessibility.',
            },
            {
                id: 'mock_3',
                jobId: 'job_456',
                candidateName: 'Amit Kumar',
                email: 'amit.k@example.com',
                alignmentScore: 45,
                status: 'rejected',
                tags: ['Java', 'Spring Boot'],
                resumePreview: 'Backend developer with focus on enterprise Java applications. Looking to transition into full stack roles.',
            }
        ];

        allApplications = [...allApplications, ...dummyApplications];

        if (jobId) {
            return allApplications.filter(app => app.jobId === jobId);
        }

        return allApplications;
    },

    getByJobId: async (jobId: string, params?: GetApplicationsByJobParams): Promise<Application[]> => {
        if (!jobId || jobId.trim() === '') {
            console.warn('Invalid jobId provided to getByJobId');
            return [];
        }

        const queryParams = new URLSearchParams();

        if (params?.status) {
            queryParams.append('status', params.status);
        }
        if (params?.minScore !== undefined) {
            queryParams.append('minScore', params.minScore.toString());
        }
        if (params?.sortBy) {
            queryParams.append('sortBy', params.sortBy);
        }
        if (params?.sortOrder) {
            queryParams.append('sortOrder', params.sortOrder);
        }
        if (params?.page !== undefined) {
            queryParams.append('page', params.page.toString());
        }
        if (params?.limit !== undefined) {
            queryParams.append('limit', params.limit.toString());
        }

        const queryString = queryParams.toString();
        const endpoint = `/api/applications/job/${jobId}${queryString ? `?${queryString}` : ''}`;

        let response;
        try {
            response = await request<any>(endpoint);
        } catch (error: unknown) {
            // If it's a 500 error, return empty array instead of throwing
            // This handles cases where the job doesn't exist or backend has issues
            const errorObj = error as any;
            const statusCode = errorObj?.status;
            
            // Handle 500 errors gracefully - backend issue, not a critical error
            // Return empty array silently without logging
            if (statusCode === 500) {
                return [];
            }
            
            // Check error message as fallback
            const errorMessage = errorObj?.message || String(error);
            if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
                return [];
            }
            
            // Re-throw other errors (network errors, 404s, etc.)
            throw error;
        }

        // Handle different response structures
        let applicationsRaw: any[] = [];
        if (Array.isArray(response)) {
            applicationsRaw = response;
        } else if (response && Array.isArray(response.data)) {
            applicationsRaw = response.data;
        } else if (response && Array.isArray(response.applications)) {
            applicationsRaw = response.applications;
        } else {
            // If response is not an array, return empty array
            console.warn('Unexpected API response structure:', response);
            return [];
        }

        // Map API response to Application interface
        return applicationsRaw.map((app: any): Application => {
            // Extract candidate info
            const candidate = app.candidate || {};
            const scores = app.scores || {};

            // Extract current company from matchInfo or tags
            let currentCompany = '';
            if (app.matchInfo && app.matchInfo.currentCompany) {
                currentCompany = app.matchInfo.currentCompany;
            } else if (Array.isArray(candidate.tags)) {
                // Try to find company-related tags
                const companyTag = candidate.tags.find((tag: string) =>
                    tag.toLowerCase().includes('company') ||
                    tag.toLowerCase().includes('paytm') ||
                    tag.toLowerCase().includes('slack')
                );
                if (companyTag) {
                    currentCompany = companyTag;
                }
            }

            return {
                // Ensure we use applicationId from backend, not id (which might be jobId)
                id: app.applicationId || app._id || app.id || '',
                applicationId: app.applicationId || app._id || app.id,
                userId: app.userId || app.user_id || app.candidate?.userId || app.candidate?.user_id || app.candidate?.id,
                jobId: app.jobId || jobId,
                candidateName: candidate.name || app.candidateName || 'Unknown',
                email: candidate.email || app.email || '',
                phone: candidate.phone || app.phone,
                alignmentScore: scores.unifiedScore || scores.resumeScore || app.alignmentScore || 0,
                status: app.status || { consentGiven: false, level1Approved: false },
                tags: Array.isArray(candidate.tags) ? candidate.tags : (Array.isArray(app.tags) ? app.tags : []),
                resumePreview: app.resumePreview,
                screeningId: app.screeningId,
                currentCompany: currentCompany || app.currentCompany,
                githubUrl: app.githubUrl || candidate.githubUrl || app.matchInfo?.githubUrl,
                portfolioUrl: app.portfolioUrl || candidate.portfolioUrl || app.matchInfo?.portfolioUrl,
                linkedinUrl: app.linkedinUrl || candidate.linkedinUrl || app.matchInfo?.linkedinUrl,
                location: app.location || app.matchInfo?.location,
                education: app.education || app.matchInfo?.education,
                currentRole: app.currentRole || app.matchInfo?.currentRole || app.matchInfo?.position,
                candidate: candidate,
                scores: scores,
                matchInfo: app.matchInfo,
                parsedResume: app.parsedResume || candidate.parsedResume,
                phoneInterviewSummaries: app.phoneInterviewSummaries || candidate.phoneInterviewSummaries || app.candidate?.phoneInterviewSummaries,
            };
        });
    },

    approveLevel1: async (id: string) => {
        return request<{ 
            success: boolean; 
            emailData?: { 
                subject?: string; 
                html?: string;
                text?: string;
                preview_text?: string;
                to?: string;
            } 
        }>(`/api/applications/${id}/approve-level1`, {
            method: 'POST'
        });
    },

    reject: async (applicationId: string) => {
        return request<{ success: boolean }>(`/api/applications/${applicationId}/reject`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    },

    batchValidateResumes: async (jobId: string, resumeFiles: File[]) => {
        const formData = new FormData();
        resumeFiles.forEach(file => {
            formData.append('resumes', file);
        });

        return request<{
            success: boolean;
            processed: number;
            applications?: Application[];
        }>(`/api/applications/batch-validate/${jobId}`, {
            method: 'POST',
            body: formData,
        });
    },

    downloadResume: async (userId: string): Promise<Blob> => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const url = `${BASE_URL}/api/users/${userId}/resume`;

        const response = await fetch(url, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || 'Failed to download resume' };
            }
            throw new Error(errorData.message || response.statusText);
        }

        return await response.blob();
    }
};
