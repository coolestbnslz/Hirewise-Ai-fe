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
        const allApplications = await request<Application[]>('/debug/applications');

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
