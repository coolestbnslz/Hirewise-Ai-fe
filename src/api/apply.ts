import { request } from './apiClient';

export const applyApi = {
    submit: async (jobId: string, formData: FormData) => {
        return request<{
            success: boolean;
            applicationId: string;
            alignmentScore: number;
            autoScreeningId?: string;
        }>(`/api/apply/${jobId}`, {
            method: 'POST',
            body: formData,
        });
    }
};
