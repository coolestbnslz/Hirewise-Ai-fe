import { useEffect, useState } from 'react';
import { applicationsApi, type Application } from '../../api/applications';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { CandidateCard } from '../../components/CandidateCard';
import { Loader2 } from 'lucide-react';

const RecruiterDashboard = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : applications.map((app) => (
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
        </div>
    );
};

export default RecruiterDashboard;
