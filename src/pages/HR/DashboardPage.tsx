import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { jobsApi, type Job } from '../../api/jobs';
import { Loader2, Plus } from 'lucide-react';

const DashboardPage = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await jobsApi.list();
                setJobs(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">HR Dashboard</h1>
                <Button asChild>
                    <Link to="/hr/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Job
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Jobs</CardTitle>
                        <CardDescription>Total jobs posted</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{jobs.length}</p>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8">Recent Jobs</h2>
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No jobs posted yet.</p>
                    <Button asChild variant="outline">
                        <Link to="/hr/create">Create your first job</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <Card key={job.id} className="hover:bg-accent/5 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium">
                                        <Link to={`/hr/jobs/${job.id}`} className="hover:underline">
                                            {job.role}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription>{job.company_name}</CardDescription>
                                </div>
                                <div className="text-sm text-muted-foreground">{job.status}</div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                    {job.enhanced_jd || job.raw_jd}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
