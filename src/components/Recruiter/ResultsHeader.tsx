import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface ResultsHeaderProps {
    totalCount: number;
    currentPage: number;
    pageSize: number;
    isAllSelected: boolean;
    onSelectAll: (selected: boolean) => void;
    onPageChange: (page: number) => void;
}

export const ResultsHeader = ({
    totalCount,
    currentPage,
    pageSize,
    isAllSelected,
    onSelectAll,
    onPageChange
}: ResultsHeaderProps) => {
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="flex items-center justify-between py-4 px-6 border-b border-border bg-card">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                    All Profiles ({totalCount})
                </span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                    {startIndex} - {endIndex} of {totalCount}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

