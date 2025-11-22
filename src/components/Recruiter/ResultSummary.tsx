import { Edit2, Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface ResultSummaryProps {
    query: string;
    matchCount: number;
    filters: {
        jobTitle: string;
        location: string;
        experience: string;
        skills: string[];
    };
    onEditFilters: () => void;
    onRunSearch: () => void;
}

export const ResultSummary = ({ query, matchCount, filters, onEditFilters, onRunSearch }: ResultSummaryProps) => {
    const filterChips = [
        { label: filters.jobTitle, type: 'jobTitle' },
        { label: filters.location, type: 'location' },
        { label: filters.experience, type: 'experience' },
        ...filters.skills.map(skill => ({ label: skill, type: 'skill' }))
    ].filter(chip => chip.label); // Filter out empty chips

    return (
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">A</span>
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="text-lg font-medium text-foreground">{query}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Do these filters look good? ({matchCount} matches)</p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {filterChips.map((chip, index) => (
                            <button
                                key={index}
                                onClick={onEditFilters}
                                className="inline-flex items-center rounded-md bg-primary/10 dark:bg-primary/20 px-2 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/10 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                            >
                                {chip.label}
                            </button>
                        ))}
                        {filterChips.length > 0 && (
                            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground" onClick={onEditFilters}>
                                Clear Filters
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={onEditFilters}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Filters
                </Button>
                <Button size="sm" onClick={onRunSearch} className="bg-primary hover:bg-primary/90 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Run Search
                </Button>
            </div>
        </div>
    );
};
