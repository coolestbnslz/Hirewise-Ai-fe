import { request } from './apiClient';

export interface Application {
    id: string;
    jobId: string;
    candidateName: string;
    email: string;
    alignmentScore: number;
    status: 'new' | 'level1_approved' | 'invited' | 'rejected';
    tags: string[];
    resumePreview: string;
    screeningId?: string;
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
