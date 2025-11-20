import { useEffect, useState } from 'react';
import { applicationsApi, type Application } from '../../api/applications';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { CandidateCard } from '../../components/CandidateCard';
import { Loader2 } from 'lucide-react';
import { SearchBox } from '../../components/Recruiter/SearchBox';
import { ResultSummary } from '../../components/Recruiter/ResultSummary';
import { FilterDrawer } from '../../components/Recruiter/FilterDrawer';

const RecruiterDashboard = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Search State
    const [hasSearched, setHasSearched] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filters, setFilters] = useState({
        jobTitle: '',
        location: '',
        experience: '',
        skills: [] as string[]
    });

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const data = await applicationsApi.list();
            setApplications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setHasSearched(true);

        // Parse query to auto-populate filters (mock logic)
        if (query.toLowerCase().includes('software engineer')) {
            setFilters(prev => ({ ...prev, jobTitle: 'Software Engineer', skills: ['Python', 'Node.js'] }));
        } else if (query.toLowerCase().includes('marketing')) {
            setFilters(prev => ({ ...prev, jobTitle: 'Marketing Manager', location: 'Europe' }));
        }
    };

    const handleUpdateFilters = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setIsFilterDrawerOpen(false);
        // In a real app, we would re-fetch data here
    };

    // Filter applications based on current filters (Client-side mock)
    const filteredApplications = applications.filter(app => {
        if (!hasSearched) return true;

        // Simple mock filtering logic
        if (filters.jobTitle && !app.tags.some(t => t.toLowerCase().includes(filters.jobTitle.toLowerCase()) || app.resumePreview.toLowerCase().includes(filters.jobTitle.toLowerCase()))) return false;
        // Add more complex filtering here if needed for demo
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                                <svg className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900">PeopleGPT by HireWise</h1>
                            <p className="text-lg text-gray-500">Find exactly who you're looking for, in seconds.</p>
                        </div>

                        <div className="w-full max-w-3xl">
                            <SearchBox onSearch={handleSearch} />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <SearchBox onSearch={handleSearch} />

                            <ResultSummary
                                query={searchQuery}
                                matchCount={filteredApplications.length}
                                filters={filters}
                                onEditFilters={() => setIsFilterDrawerOpen(true)}
                                onRunSearch={() => { }}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                <div className="col-span-full flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : filteredApplications.map((app) => (
                                <Card key={app.id} className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setSelectedApp(app)}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium">{app.candidateName}</CardTitle>
                                        <div className={`text-sm font-bold ${app.alignmentScore >= 80 ? 'text-green-500' : app.alignmentScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {app.alignmentScore}%
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground mb-2">{app.email}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {app.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                <Modal
                    isOpen={!!selectedApp}
                    onClose={() => setSelectedApp(null)}
                    title="Candidate Profile"
                >
                    {selectedApp && (
                        <CandidateCard
                            application={selectedApp}
                            onClose={() => setSelectedApp(null)}
                            onUpdate={fetchApplications}
                        />
                    )}
                </Modal>

                <FilterDrawer
                    isOpen={isFilterDrawerOpen}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    filters={filters}
                    onSave={handleUpdateFilters}
                />
            </div>
        </div>
    );
};

export default RecruiterDashboard;
