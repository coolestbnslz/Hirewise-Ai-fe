import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { jobsApi } from '../../api/jobs';
import { Loader2 } from 'lucide-react';

// Helper to cast string input to array for form handling
const JobFormSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    role: z.string().min(2, "Role is required"),
    seniority: z.string().min(2, "Seniority is required"),
    raw_jd: z.string().min(10, "Job description is required"),
    budget_info: z.string().optional(),
    must_have_skills: z.string(),
    nice_to_have: z.string(),
});

type JobFormInput = z.infer<typeof JobFormSchema>;

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [clarifyingQuestions, setClarifyingQuestions] = useState<{ id: string; question: string }[] | null>(null);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const form = useForm<JobFormInput>({
        resolver: zodResolver(JobFormSchema),
        defaultValues: {
            company_name: '',
            role: '',
            seniority: '',
            raw_jd: '',
            budget_info: '',
            must_have_skills: '',
            nice_to_have: '',
        }
    });

    const onSubmit = async (data: JobFormInput) => {
        setIsLoading(true);
        try {
            const job = await jobsApi.create({
                ...data,
                must_have_skills: data.must_have_skills.split(',').map(s => s.trim()).filter(Boolean),
                nice_to_have: data.nice_to_have.split(',').map(s => s.trim()).filter(Boolean),
                budget_info: data.budget_info || '',
            });

            if (job.clarifying_questions) {
                setClarifyingQuestions(job.clarifying_questions);
                setCurrentJobId(job.id);
            } else {
                navigate(`/hr/jobs/${job.id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClarificationSubmit = async () => {
        if (!currentJobId) return;
        setIsLoading(true);
        try {
            await jobsApi.clarify(currentJobId, answers);
            navigate(`/hr/jobs/${currentJobId}`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 animate-in fade-in duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>Post a New Job</CardTitle>
                    <CardDescription>Enter the details below. Our AI agent will help you refine the job description.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <Input {...form.register('company_name')} placeholder="Acme Inc." />
                                {form.formState.errors.company_name && <p className="text-red-500 text-xs">{form.formState.errors.company_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role Title</label>
                                <Input {...form.register('role')} placeholder="Senior Frontend Engineer" />
                                {form.formState.errors.role && <p className="text-red-500 text-xs">{form.formState.errors.role.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Seniority Level</label>
                            <Input {...form.register('seniority')} placeholder="Senior / Lead / Staff" />
                            {form.formState.errors.seniority && <p className="text-red-500 text-xs">{form.formState.errors.seniority.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Raw Job Description</label>
                            <textarea
                                {...form.register('raw_jd')}
                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Paste the raw JD here..."
                            />
                            {form.formState.errors.raw_jd && <p className="text-red-500 text-xs">{form.formState.errors.raw_jd.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Must-Have Skills (comma separated)</label>
                            <Input {...form.register('must_have_skills')} placeholder="React, TypeScript, Node.js" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nice-to-Have Skills (comma separated)</label>
                            <Input {...form.register('nice_to_have')} placeholder="AWS, GraphQL" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Budget / Salary Range</label>
                            <Input {...form.register('budget_info')} placeholder="$120k - $160k" />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? 'Processing...' : 'Create Job'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Modal
                isOpen={!!clarifyingQuestions}
                onClose={() => setClarifyingQuestions(null)}
                title="Clarifying Questions"
                footer={
                    <Button onClick={handleClarificationSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Answers
                    </Button>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Our AI needs a few more details to create the perfect job post.</p>
                    {clarifyingQuestions?.map((q) => (
                        <div key={q.id} className="space-y-2">
                            <label className="text-sm font-medium">{q.question}</label>
                            <Input
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Your answer..."
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default CreateJobPage;
