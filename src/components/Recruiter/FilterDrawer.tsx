import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-card shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="text-lg font-semibold text-foreground">Edit Filters</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <form onSubmit={handleSubmit} className="px-6 py-6 pb-24 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Job Title</label>
                            <Input name="jobTitle" defaultValue={filters.jobTitle} placeholder="e.g. Software Engineer" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Location</label>
                            <Input name="location" defaultValue={filters.location} placeholder="e.g. San Francisco" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Years of Experience</label>
                            <Input name="experience" defaultValue={filters.experience} placeholder="e.g. 5+ years" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Skills (comma separated)</label>
                            <Input name="skills" defaultValue={filters.skills.join(', ')} placeholder="e.g. Python, React, Node.js" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Industry</label>
                            <Input name="industry" placeholder="e.g. Fintech" />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={(e) => {
                        // Trigger form submission programmatically since button is outside form
                        const form = e.currentTarget.closest('.flex-col')?.querySelector('form');
                        if (form) {
                            form.requestSubmit();
                        }
                    }} className="bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white">Save Changes</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
