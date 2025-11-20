import { request } from './apiClient';

export interface TagStatus {
    label: string;
    containsCriteria: boolean;
}

export const analysisApi = {
    checkCriteria: async (text: string) => {
        return request<TagStatus[]>('/api/analysis/check-criteria', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }
};
