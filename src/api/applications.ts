import { request } from './apiClient';

export interface Application {
    id: string;
    applicationId?: string;
    jobId: string;
    candidateName: string;
    email: string;
    phone?: string;
    alignmentScore: number;
    status: 'new' | 'level1_approved' | 'invited' | 'rejected' | { consentGiven?: boolean; level1Approved?: boolean; [key: string]: any };
    tags: string[];
    resumePreview?: string;
    screeningId?: string;
    currentCompany?: string;
    // API response structure
    candidate?: {
        name: string;
        email: string;
        phone?: string;
        tags: string[];
    };
    scores?: {
        resumeScore?: number;
        githubPortfolioScore?: number | null;
        compensationScore?: number | null;
        unifiedScore?: number;
        compensationAnalysis?: any;
    };
    matchInfo?: any;
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
        
        const response = await request<any>(endpoint);
        
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
                id: app.applicationId || app.id || '',
                applicationId: app.applicationId,
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
                candidate: candidate,
                scores: scores,
                matchInfo: app.matchInfo,
            };
        });
    },

    approveLevel1: async (id: string) => {
        return request<{ success: boolean }>(`/api/applications/${id}/approve-level1`, {
            method: 'POST'
        });
    },

    reject: async (_id: string) => {
        // Backend doesn't have a specific reject endpoint in the collection yet.
        // We'll simulate success for now to keep UI functional.
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }
};
