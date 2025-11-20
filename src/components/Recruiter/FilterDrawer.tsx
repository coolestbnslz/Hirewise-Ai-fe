import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        jobTitle: string;
        location: string;
        experience: string;
        skills: string[];
    };
    onSave: (newFilters: any) => void;
}

export const FilterDrawer = ({ isOpen, onClose, filters, onSave }: FilterDrawerProps) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const newFilters = {
            jobTitle: formData.get('jobTitle') as string,
            location: formData.get('location') as string,
            experience: formData.get('experience') as string,
            skills: (formData.get('skills') as string).split(',').map(s => s.trim()).filter(Boolean)
        };
        onSave(newFilters);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Edit Filters</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Job Title</label>
                        <Input name="jobTitle" defaultValue={filters.jobTitle} placeholder="e.g. Software Engineer" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <Input name="location" defaultValue={filters.location} placeholder="e.g. San Francisco" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                        <Input name="experience" defaultValue={filters.experience} placeholder="e.g. 5+ years" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Skills (comma separated)</label>
                        <Input name="skills" defaultValue={filters.skills.join(', ')} placeholder="e.g. Python, React, Node.js" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Industry</label>
                        <Input name="industry" placeholder="e.g. Fintech" />
                    </div>
                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" onClick={(e) => {
                        // Trigger form submission programmatically since button is outside form
                        const form = e.currentTarget.closest('.flex-col')?.querySelector('form');
                        form?.requestSubmit();
                    }}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};
