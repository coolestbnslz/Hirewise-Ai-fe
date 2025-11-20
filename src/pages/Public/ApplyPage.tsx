import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, type Job } from '../../api/jobs';
import { applyApi } from '../../api/apply';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Loader2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ApplyPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

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

    const onSubmit = async (data: any) => {
        if (!jobId) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] instanceof FileList) {
                    formData.append(key, data[key][0]);
                } else {
                    formData.append(key, data[key]);
                }
            });

            const result = await applyApi.submit(jobId, formData);

            // Navigate to success/screening page (to be implemented)
            // For now, just show alert or redirect
            if (result.autoScreeningId) {
                // navigate(`/screening/${result.autoScreeningId}`);
                alert(`Application received! Score: ${result.alignmentScore}. Proceeding to screening...`);
            } else {
                alert(`Application received! Score: ${result.alignmentScore}. We will be in touch.`);
                navigate(`/agent/${jobId}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!job) return <div className="flex justify-center items-center min-h-screen">Job not found</div>;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <Card className="max-w-lg w-full">
                <CardHeader>
                    <CardTitle>Apply for {job.role}</CardTitle>
                    <CardDescription>at {job.company_name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {job.apply_form_fields?.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-sm font-medium">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        {...register(field.id, { required: field.required })}
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                ) : field.type === 'file' ? (
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                {...register(field.id, { required: field.required })}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <Input
                                        type={field.type}
                                        {...register(field.id, { required: field.required })}
                                    />
                                )}
                                {errors[field.id] && <p className="text-red-500 text-xs">This field is required</p>}
                            </div>
                        ))}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Application
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApplyPage;
