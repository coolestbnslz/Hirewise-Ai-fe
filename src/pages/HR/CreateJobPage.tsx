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
import { Loader2, Sparkles, CheckCircle2, Zap } from 'lucide-react';

// Helper to cast string input to array for form handling
const JobFormSchema = z.object({
    company_name: z.string().min(2, "Company name is required"),
    role: z.string().min(2, "Role is required"),
    seniority: z.string().min(2, "Seniority is required"),
    raw_jd: z.string().refine((val) => {
        if (!val || val.trim() === '') return true; // Allow empty strings
        return val.length >= 10; // If provided, must be at least 10 characters
    }, {
        message: "Job description must be at least 10 characters"
    }).optional(),
    budget_info: z.string().optional(),
    must_have_skills: z.string().min(1, "Must-have skills are required"),
    nice_to_have: z.string(),
});

type JobFormInput = z.infer<typeof JobFormSchema>;

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractText, setExtractText] = useState('');
    const [fieldsExtracted, setFieldsExtracted] = useState(false);
    const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);
    const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
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
                raw_jd: data.raw_jd || '',
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

    const handleExtractFields = async () => {
        if (!extractText.trim()) return;
        
        setIsExtracting(true);
        setFieldsExtracted(false);
        try {
            const extracted = await jobsApi.extractFields(extractText);
            
            let filledCount = 0;
            
            // Auto-fill form fields with animation delay
            const fillFields = async () => {
                const highlightField = (fieldName: string) => {
                    setHighlightedFields(prev => new Set(prev).add(fieldName));
                    setTimeout(() => {
                        setHighlightedFields(prev => {
                            const next = new Set(prev);
                            next.delete(fieldName);
                            return next;
                        });
                    }, 2000);
                };
                
                if (extracted.company_name) {
                    form.setValue('company_name', extracted.company_name);
                    highlightField('company_name');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.role) {
                    form.setValue('role', extracted.role);
                    highlightField('role');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.seniority) {
                    form.setValue('seniority', extracted.seniority);
                    highlightField('seniority');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.raw_jd) {
                    form.setValue('raw_jd', extracted.raw_jd);
                    highlightField('raw_jd');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.budget_info) {
                    form.setValue('budget_info', extracted.budget_info);
                    highlightField('budget_info');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.must_have_skills && extracted.must_have_skills.length > 0) {
                    form.setValue('must_have_skills', extracted.must_have_skills.join(', '));
                    highlightField('must_have_skills');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                if (extracted.nice_to_have && extracted.nice_to_have.length > 0) {
                    form.setValue('nice_to_have', extracted.nice_to_have.join(', '));
                    highlightField('nice_to_have');
                    filledCount++;
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                
                setExtractedFieldsCount(filledCount);
                setFieldsExtracted(true);
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    setFieldsExtracted(false);
                }, 5000);
            };
            
            await fillFields();
            
            // Clear the extract text after successful extraction
            setExtractText('');
        } catch (error) {
            console.error('Failed to extract fields:', error);
            alert('Failed to extract fields. Please try again.');
        } finally {
            setIsExtracting(false);
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
        <div className="max-w-3xl mx-auto py-8 animate-in fade-in duration-500 space-y-6">
            {/* AI Extract Section */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI-Powered Field Extraction
                    </CardTitle>
                    <CardDescription>
                        Describe your job requirements in natural language, and our AI will automatically extract and fill the form fields below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Job Description Text</label>
                            <textarea
                                value={extractText}
                                onChange={(e) => setExtractText(e.target.value)}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., senior soft eng with 3+ year in Noida with react nodejs budget max 30 LPA"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleExtractFields}
                            disabled={isExtracting || !extractText.trim()}
                            className="relative w-full group overflow-hidden rounded-md px-6 py-3.5 font-semibold text-white transition-all duration-300 ease-out
                                bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 
                                hover:from-purple-500 hover:via-blue-500 hover:to-cyan-400
                                disabled:opacity-50 disabled:cursor-not-allowed
                                shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60
                                transform hover:scale-[1.02] active:scale-[0.98]
                                border border-white/20"
                        >
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            
                            {/* Content */}
                            <div className="relative flex items-center justify-center gap-2">
                                {isExtracting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-base">AI is analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Sparkles className="h-5 w-5 animate-pulse" />
                                            <div className="absolute inset-0 bg-card/30 rounded-full blur-sm animate-ping" />
                                        </div>
                                        <span className="text-base font-bold">Extract with AI</span>
                                        <Zap className="h-4 w-4 opacity-80" />
                                    </>
                                )}
                            </div>
                            
                            {/* Glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 rounded-md blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
                        </button>
                        
                        {/* Success notification */}
                        {fieldsExtracted && (
                            <div className="animate-in slide-in-from-top-2 duration-300 flex items-center gap-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md shadow-sm">
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900">
                                        Successfully extracted {extractedFieldsCount} field{extractedFieldsCount !== 1 ? 's' : ''}!
                                    </p>
                                    <p className="text-xs text-green-700 mt-0.5">
                                        Fields have been auto-filled below. Review and edit as needed.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Post New Job Form */}
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
                                <Input 
                                    {...form.register('company_name')} 
                                    placeholder="Acme Inc."
                                    className={highlightedFields.has('company_name') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                                />
                                {form.formState.errors.company_name && <p className="text-red-500 text-xs">{form.formState.errors.company_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role Title</label>
                                <Input 
                                    {...form.register('role')} 
                                    placeholder="Senior Frontend Engineer"
                                    className={highlightedFields.has('role') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                                />
                                {form.formState.errors.role && <p className="text-red-500 text-xs">{form.formState.errors.role.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Seniority Level</label>
                            <Input 
                                {...form.register('seniority')} 
                                placeholder="Senior / Lead / Staff"
                                className={highlightedFields.has('seniority') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                            />
                            {form.formState.errors.seniority && <p className="text-red-500 text-xs">{form.formState.errors.seniority.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Job Description</label>
                            <textarea
                                {...form.register('raw_jd')}
                                className={`flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    highlightedFields.has('raw_jd') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''
                                }`}
                                placeholder="Paste the job description here (optional)..."
                            />
                            {form.formState.errors.raw_jd && <p className="text-red-500 text-xs">{form.formState.errors.raw_jd.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Must-Have Skills (comma separated)</label>
                            <Input 
                                {...form.register('must_have_skills')} 
                                placeholder="React, TypeScript, Node.js"
                                className={highlightedFields.has('must_have_skills') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                            />
                            {form.formState.errors.must_have_skills && <p className="text-red-500 text-xs">{form.formState.errors.must_have_skills.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nice-to-Have Skills (comma separated)</label>
                            <Input 
                                {...form.register('nice_to_have')} 
                                placeholder="AWS, GraphQL"
                                className={highlightedFields.has('nice_to_have') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Budget / Salary Range</label>
                            <Input 
                                {...form.register('budget_info')} 
                                placeholder="$120k - $160k"
                                className={highlightedFields.has('budget_info') ? 'animate-pulse border-green-400 bg-green-50/50 ring-2 ring-green-300' : ''}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white" disabled={isLoading}>
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
                    <Button onClick={handleClarificationSubmit} disabled={isLoading} className="bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white">
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
