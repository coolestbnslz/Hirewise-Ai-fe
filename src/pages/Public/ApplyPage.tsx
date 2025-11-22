import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, type Job } from '../../api/jobs';
import { applyApi } from '../../api/apply';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Loader2, Upload, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { TimeoutError, NetworkError } from '../../api/apiClient';
import { ThemeToggle } from '../../components/ThemeToggle';

const ApplyPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [hasAutoScreening, setHasAutoScreening] = useState(false);
    const [screeningId, setScreeningId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

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

    const onSubmit = async (data: Record<string, unknown>) => {
        if (!jobId) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            
            // Mapping function to convert frontend field names to backend field names
            const mapFieldName = (frontendName: string): string => {
                const mapping: Record<string, string> = {
                    // Name variations
                    'name': 'applicant_name',
                    'full_name': 'applicant_name',
                    'applicant_name': 'applicant_name',
                    // Email variations
                    'email': 'applicant_email',
                    'applicant_email': 'applicant_email',
                    // Phone variations
                    'phone': 'applicant_phone',
                    'applicant_phone': 'applicant_phone',
                    // Resume
                    'resume': 'resume',
                    // GitHub variations
                    'github': 'githubUrl',
                    'githubUrl': 'githubUrl',
                    'github_profile': 'githubUrl',
                    'github_url': 'githubUrl',
                    // Portfolio variations
                    'portfolio': 'portfolioUrl',
                    'portfolioUrl': 'portfolioUrl',
                    'portfolio_profile': 'portfolioUrl',
                    'portfolio_url': 'portfolioUrl',
                    // LinkedIn variations (if supported)
                    'linkedin': 'linkedinUrl',
                    'linkedinUrl': 'linkedinUrl',
                    'linkedin_profile': 'linkedinUrl',
                    'linkedin_url': 'linkedinUrl',
                    // Compensation variations
                    'compensation': 'compensationExpectation',
                    'compensationExpectation': 'compensationExpectation',
                    'compensation_expectation': 'compensationExpectation',
                };
                
                // Normalize the key (lowercase, handle underscores)
                const normalizedKey = frontendName.toLowerCase().replace(/-/g, '_');
                
                // Check if there's a direct mapping
                if (mapping[frontendName]) {
                    return mapping[frontendName];
                }
                
                // Check normalized key
                if (mapping[normalizedKey]) {
                    return mapping[normalizedKey];
                }
                
                // Check if field name already matches backend format
                if (frontendName.startsWith('applicant_') || 
                    frontendName === 'resume' || 
                    frontendName === 'githubUrl' || 
                    frontendName === 'portfolioUrl' ||
                    frontendName === 'linkedinUrl' ||
                    frontendName === 'compensationExpectation') {
                    return frontendName;
                }
                
                // Skip fields that are not part of the API
                const skipFields = ['experience', 'current_company', 'years_of_experience'];
                if (skipFields.includes(frontendName.toLowerCase()) || skipFields.includes(normalizedKey)) {
                    return ''; // Return empty string to skip
                }
                
                // Default: use frontend name as-is
                return frontendName;
            };
            
            // Type guard for FileList
            const isFileList = (val: unknown): val is FileList => {
                return val !== null &&
                       typeof val === 'object' &&
                       'length' in val &&
                       'item' in val &&
                       typeof (val as Record<string, unknown>).item === 'function';
            };
            
            // Type guard for File-like object
            const isFileLike = (val: unknown): val is Blob => {
                return val !== null &&
                       typeof val === 'object' &&
                       'name' in val &&
                       'size' in val &&
                       typeof (val as Record<string, unknown>).name === 'string';
            };
            
            Object.keys(data).forEach(key => {
                const value = data[key];
                const backendKey = mapFieldName(key);
                
                // Skip if backendKey is empty (field should not be sent)
                if (!backendKey) {
                    return;
                }
                
                // Check if value is a FileList
                if (isFileList(value) && value.length > 0 && value[0]) {
                    const file = value[0];
                    if (isFileLike(file)) {
                        formData.append(backendKey, file);
                    }
                } 
                // Check if value is a File-like object directly
                else if (isFileLike(value) && !('length' in value)) {
                    formData.append(backendKey, value);
                } 
                // Handle primitive values - always append strings (including empty strings)
                else if (typeof value === 'string') {
                    formData.append(backendKey, value);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    formData.append(backendKey, String(value));
                } else if (value === null || value === undefined) {
                    // Append empty string for null/undefined optional fields
                    formData.append(backendKey, '');
                }
            });
            
            // Debug: Log FormData contents
            console.log('FormData entries:');
            for (const [key, val] of formData.entries()) {
                if (isFileLike(val)) {
                    const file = val as unknown as Record<string, unknown>;
                    console.log(key, `File: ${file.name} (${file.size} bytes, type: ${file.type || 'unknown'})`);
                } else {
                    console.log(key, val);
                }
            }

            // Clear any previous errors
            setError(null);

            const result = await applyApi.submit(jobId, formData);

            // Show success modal
            if (result.autoScreeningId) {
                setHasAutoScreening(true);
                setScreeningId(result.autoScreeningId);
            } else {
                setHasAutoScreening(false);
            }
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Application submission error:', error);
            
            // Handle different types of errors
            if (error instanceof TimeoutError) {
                setError('The request timed out. This might happen if the file is large or the server is busy. Please try again.');
            } else if (error instanceof NetworkError) {
                setError('Network error. Please check your internet connection and try again.');
            } else if (error instanceof Error) {
                // Check for 499 status code in error message
                if (error.message.includes('499') || error.message.toLowerCase().includes('timeout')) {
                    setError('Request timed out. The server took too long to process your application. Please try again with a smaller file or contact support if the issue persists.');
                } else {
                    setError(error.message || 'Failed to submit application. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!job) return <div className="flex justify-center items-center min-h-screen">Job not found</div>;

    // Default fields if none are provided
    const defaultFields = [
        { id: 'applicant_name', label: 'Full Name', type: 'text' as const, required: true },
        { id: 'applicant_email', label: 'Email Address', type: 'text' as const, required: true },
        { id: 'applicant_phone', label: 'Phone Number', type: 'text' as const, required: false },
        { id: 'resume', label: 'Resume', type: 'file' as const, required: true },
        { id: 'githubUrl', label: 'GitHub URL', type: 'text' as const, required: false },
        { id: 'portfolioUrl', label: 'Portfolio URL', type: 'text' as const, required: false },
        { id: 'compensationExpectation', label: 'Compensation Expectation', type: 'text' as const, required: false },
    ];

    // Use provided fields or fallback to defaults
    const formFields = job.apply_form_fields && job.apply_form_fields.length > 0 
        ? job.apply_form_fields.filter(field => field && field.id)
        : defaultFields;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <ThemeToggle />
            <Card className="max-w-lg w-full">
                <CardHeader>
                    <CardTitle>Apply for {job.role}</CardTitle>
                    <CardDescription>at {job.company_name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {formFields.map((field) => {
                            const fieldName = String(field.id);
                            return (
                                <div key={fieldName} className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            {...register(fieldName, { required: field.required })}
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                        />
                                    ) : field.type === 'file' ? (() => {
                                        const fileInput = watch(fieldName) as FileList | null;
                                        const selectedFile = fileInput && fileInput.length > 0 ? fileInput[0] : null;
                                        
                                        return (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center w-full">
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                            <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="application/pdf,.pdf"
                                                            className="hidden"
                                                            {...register(fieldName, { 
                                                                required: field.required,
                                                                validate: (files: FileList | null) => {
                                                                    if (!files || files.length === 0) {
                                                                        return field.required ? 'File is required' : true;
                                                                    }
                                                                    const file = files[0];
                                                                    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                                                                        return 'Please upload a PDF file';
                                                                    }
                                                                    return true;
                                                                }
                                                            })}
                                                        />
                                                    </label>
                                                </div>
                                                {selectedFile && (
                                                    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
                                                        <File className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground flex-1 truncate">{selectedFile.name}</span>
                                                        <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })(                                    ) : (
                                        <Input
                                            type={
                                                fieldName.toLowerCase().includes('email') || fieldName === 'applicant_email' 
                                                    ? 'email' 
                                                    : fieldName.toLowerCase().includes('phone') || fieldName === 'applicant_phone' || fieldName.toLowerCase().includes('tel') 
                                                        ? 'tel' 
                                                        : fieldName.toLowerCase().includes('url') || fieldName === 'githubUrl' || fieldName === 'portfolioUrl'
                                                            ? 'url'
                                                            : 'text'
                                            }
                                            {...register(fieldName, { required: field.required })}
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                        />
                                    )}
                                    {errors[fieldName] && <p className="text-red-500 text-xs">This field is required</p>}
                                </div>
                            );
                        })}

                        {error && (
                            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-destructive">Submission Failed</p>
                                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-black dark:bg-gray-800 hover:bg-black/90 dark:hover:bg-gray-700 text-white" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Application
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (hasAutoScreening && screeningId) {
                        navigate(`/screening/${screeningId}`);
                    } else {
                        navigate(`/agent/${jobId}`);
                    }
                }}
                showCloseButton={false}
            >
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">Application Received</h3>
                        <p className="text-muted-foreground text-lg">
                            We will be in touch
                        </p>
                    </div>
                    <Button 
                        onClick={() => {
                            setShowSuccessModal(false);
                            if (hasAutoScreening && screeningId) {
                                navigate(`/screening/${screeningId}`);
                            } else {
                                navigate(`/agent/${jobId}`);
                            }
                        }}
                        className="mt-4"
                    >
                        Continue
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ApplyPage;
