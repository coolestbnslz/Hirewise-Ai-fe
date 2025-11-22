import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsApi, type Job } from '../../api/jobs';
import { applicationsApi, type Application } from '../../api/applications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, ExternalLink, Copy, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { CandidateCard } from '../../components/Recruiter/CandidateCard';
import { CandidateProfileDrawer } from '../../components/Recruiter/CandidateProfileDrawer';

const JobDetailPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingApplications, setIsLoadingApplications] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [isImportingResumes, setIsImportingResumes] = useState(false);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');

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

    const fetchApplications = useCallback(async () => {
        if (!jobId || !job) return; // Only fetch if jobId exists and job is loaded
        setIsLoadingApplications(true);
        try {
            const params: { sortBy: string; sortOrder: 'desc'; status?: string } = {
                sortBy: 'score',
                sortOrder: 'desc'
            };
            
            // Add status parameter based on active tab
            if (activeTab === 'approved') {
                params.status = 'approved';
            } else if (activeTab === 'rejected') {
                params.status = 'rejected';
            } else if (activeTab === 'pending') {
                params.status = 'pending';
            }
            
            const data = await applicationsApi.getByJobId(jobId, params);
            // Ensure data is always an array
            setApplications(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            // This catch should rarely be hit now since 500 errors are handled in applications.ts
            // But handle any other unexpected errors gracefully
            const errorObj = error as any;
            const errorMessage = errorObj?.message || String(error);
            if (errorObj?.status !== 500 && !errorMessage.includes('500')) {
                console.error('Failed to fetch applications:', error);
            }
            // Always set empty array on error to prevent UI crashes
            setApplications([]);
        } finally {
            setIsLoadingApplications(false);
        }
    }, [jobId, job, activeTab]);

    useEffect(() => {
        // Only fetch applications after job is successfully loaded
        if (jobId && job) {
            fetchApplications();
        }
    }, [jobId, job, fetchApplications]);

    if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!job) return <div className="text-center py-8">Job not found</div>;

    const publicLink = `${window.location.origin}/agent/${job.id}`;

    const selectedCandidate = applications.find(app =>
        (app.id || app.applicationId) === selectedCandidateId
    );

    const handleImportResumes = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !jobId) return;

        setIsImportingResumes(true);
        setImportMessage(null);

        try {
            const fileArray = Array.from(files);
            
            // Validate all files are PDFs
            const invalidFiles = fileArray.filter(file => file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'));
            if (invalidFiles.length > 0) {
                throw new Error(`Please upload only PDF files. Found ${invalidFiles.length} invalid file(s).`);
            }

            const result = await applicationsApi.batchValidateResumes(jobId, fileArray);
            
            setImportMessage({
                type: 'success',
                text: `Successfully imported ${result.processed || fileArray.length} resume(s). Applications are being processed.`
            });

            // Refresh applications list after a short delay to allow backend processing
            setTimeout(() => {
                fetchApplications();
            }, 2000);

            // Clear message after 5 seconds
            setTimeout(() => {
                setImportMessage(null);
            }, 5000);
        } catch (error) {
            console.error('Failed to import resumes:', error);
            setImportMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to import resumes. Please try again.'
            });
        } finally {
            setIsImportingResumes(false);
            // Reset file input
            event.target.value = '';
        }
    };

    // Map selected candidate to the format expected by CandidateProfileDrawer if needed
    // Ideally CandidateProfileDrawer should handle the raw application object, which we implemented.

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{job.role}</h1>
                    <p className="text-muted-foreground">{job.company_name} • {job.seniority}</p>
                </div>
                <div className="flex space-x-2">
                    <input
                        type="file"
                        id="resume-upload"
                        accept="application/pdf,.pdf"
                        multiple
                        onChange={handleImportResumes}
                        className="hidden"
                        disabled={isImportingResumes}
                    />
                    <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('resume-upload')?.click()}
                        disabled={isImportingResumes}
                    >
                        {isImportingResumes ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Resumes
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to={`/agent/${job.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Public Page
                        </Link>
                    </Button>
                    <Button className="bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white">Publish Job</Button>
                </div>
            </div>

            {/* Import Message */}
            {importMessage && (
                <div className={`flex items-start gap-2 p-4 rounded-md border ${
                    importMessage.type === 'success' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                }`}>
                    {importMessage.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${
                        importMessage.type === 'success' ? 'text-green-900' : 'text-red-900'
                    }`}>
                        {importMessage.text}
                    </p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enhanced Job Description</CardTitle>
                            <CardDescription>Generated by our AI agent based on your input.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                {job.enhanced_jd || job.raw_jd}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle>Applications</CardTitle>
                                    <CardDescription>
                                        {isLoadingApplications
                                            ? 'Loading applications...'
                                            : `${applications.length} ${applications.length === 1 ? 'match' : 'matches'} found`}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={fetchApplications}
                                    disabled={isLoadingApplications || !jobId}
                                    className="ml-4"
                                    title="Refresh matches"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoadingApplications ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Tabs */}
                            <div className="border-b border-border mb-6">
                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className={`
                                            py-3 text-sm font-medium border-b-2 transition-colors
                                            ${activeTab === 'all'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                                        `}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('approved')}
                                        className={`
                                            py-3 text-sm font-medium border-b-2 transition-colors
                                            ${activeTab === 'approved'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                                        `}
                                    >
                                        Approved
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('rejected')}
                                        className={`
                                            py-3 text-sm font-medium border-b-2 transition-colors
                                            ${activeTab === 'rejected'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                                        `}
                                    >
                                        Rejected
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`
                                            py-3 text-sm font-medium border-b-2 transition-colors
                                            ${activeTab === 'pending'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                                        `}
                                    >
                                        Pending
                                    </button>
                                </div>
                            </div>
                            {isLoadingApplications ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : !Array.isArray(applications) || applications.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No applications found for this job yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((application) => {
                                        const resumeScore = application.scores?.resumeScore || application.alignmentScore;
                                        const unifiedScore = application.scores?.unifiedScore || application.alignmentScore;

                                        // Map Application to CandidateCard props
                                        const resume = application.parsedResume || application.candidate?.parsedResume;
                                        const experience = resume?.experience?.[0];
                                        const education = resume?.education?.[0];
                                        const contact = resume?.contact;

                                        const candidateData = {
                                            id: application.id || application.applicationId || '',
                                            name: application.candidateName,
                                            email: application.email,
                                            phone: application.phone,
                                            // Prefer parsed resume data, fallback to top-level fields
                                            role: experience?.title || application.candidate?.currentRole?.title,
                                            company: experience?.company || application.currentCompany || application.candidate?.currentRole?.company,
                                            location: experience?.location || application.candidate?.currentRole?.location,
                                            education: education ? `${education.degree} ${education.field ? `, ${education.field}` : ''} at ${education.institution}` :
                                                (application.candidate?.education ? `${application.candidate.education.degree || ''} ${application.candidate.education.field || ''} at ${application.candidate.education.university || ''}` : undefined),
                                            bio: application.resumePreview || application.candidate?.bio || application.candidate?.summary,
                                            skills: application.tags || application.candidate?.tags || application.candidate?.skills,
                                            matchScore: unifiedScore,
                                            resumeScore: resumeScore,
                                            status: typeof application.status === 'string' ? application.status : 'Unknown',
                                            socialLinks: {
                                                linkedin: contact?.linkedin || application.candidate?.linkedin,
                                                github: contact?.github || application.candidate?.github,
                                                portfolio: contact?.portfolio || application.candidate?.portfolio || application.candidate?.website
                                            }
                                        };

                                        return (
                                            <CandidateCard
                                                key={candidateData.id}
                                                candidate={candidateData}
                                                onView={(id) => setSelectedCandidateId(id)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Public Link</label>
                                <div className="flex space-x-2">
                                    <Input readOnly value={publicLink} />
                                    <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(publicLink)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {job.status}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CandidateProfileDrawer
                isOpen={!!selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)}
                candidate={selectedCandidate}
            />
        </div>
    );
};

export default JobDetailPage;
