import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { screeningsApi, type Screening } from '../../api/screenings';
import { Recorder } from '../../components/Recorder';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

const ScreeningPage = () => {
    const { screeningId } = useParams<{ screeningId: string }>();
    const navigate = useNavigate();
    const [screening, setScreening] = useState<Screening | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        const fetchScreening = async () => {
            if (!screeningId) return;
            try {
                const data = await screeningsApi.get(screeningId);
                setScreening(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchScreening();
    }, [screeningId]);

    const handleUpload = async (blob: Blob) => {
        if (!screening || !screeningId) return;

        await screeningsApi.uploadVideo(screeningId, currentQuestionIndex, blob);

        if (currentQuestionIndex < screening.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            await screeningsApi.complete(screeningId);
            setIsCompleted(true);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!screening) return <div className="flex justify-center items-center min-h-screen">Screening not found</div>;

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold">Screening Completed!</h2>
                        <p className="text-muted-foreground">Thank you for your time. Our team will review your answers shortly.</p>
                        <Button onClick={() => navigate('/')}>Back to Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <ThemeToggle />
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Video Screening</h1>
                    <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {screening.questions.length}</p>
                </div>

                <Recorder
                    key={currentQuestionIndex} // Force remount to reset state
                    question={screening.questions[currentQuestionIndex]}
                    onUpload={handleUpload}
                />
            </div>
        </div>
    );
};

export default ScreeningPage;
