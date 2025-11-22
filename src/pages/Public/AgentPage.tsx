import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsApi, type Job } from '../../api/jobs';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

const AgentPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) return;
            try {
                const data = await jobsApi.get(jobId);
                setJob(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!job) return <div className="flex justify-center items-center min-h-screen">Job not found</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <ThemeToggle />
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">{job.role}</h1>
                    <p className="text-xl text-muted-foreground">{job.company_name}</p>
                </div>

                <Card className="border-2">
                    <CardHeader>
                        <CardTitle>About the Role</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                            {job.enhanced_jd || job.raw_jd}
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Requirements</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.must_have_skills.map((skill) => (
                                    <span key={skill} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-muted text-foreground hover:bg-muted/80">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <Button size="lg" className="w-full md:w-auto px-8 bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white" asChild>
                        <Link to={`/agent/${job.id}/apply`}>
                            Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AgentPage;
