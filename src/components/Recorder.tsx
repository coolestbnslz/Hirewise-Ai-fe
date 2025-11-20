import { useEffect, useRef, useState } from 'react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { Button } from './ui/Button';
import { Loader2, Video, Square, RotateCcw, Upload } from 'lucide-react';
import { Card } from './ui/Card';

interface RecorderProps {
    onUpload: (blob: Blob) => Promise<void>;
    question: string;
    timeLimitSeconds?: number;
}

export const Recorder = ({ onUpload, question, timeLimitSeconds = 60 }: RecorderProps) => {
    const { status, startRecording, stopRecording, resetRecording, mediaBlob, error, stream } = useMediaRecorder();
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (videoPreviewRef.current && stream) {
            videoPreviewRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        let interval: any;
        if (status === 'recording' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft, stopRecording]);

    const handleUpload = async () => {
        if (!mediaBlob) return;
        setIsUploading(true);
        try {
            await onUpload(mediaBlob);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleStart = () => {
        setTimeLeft(timeLimitSeconds);
        startRecording();
    };

    return (
        <div className="space-y-4 w-full max-w-md mx-auto">
            <div className="text-lg font-medium text-center">{question}</div>

            <Card className="overflow-hidden bg-black aspect-video relative flex items-center justify-center">
                {error ? (
                    <div className="text-red-500 p-4 text-center">{error}</div>
                ) : status === 'recording' ? (
                    <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : status === 'stopped' && mediaBlob ? (
                    <video
                        src={URL.createObjectURL(mediaBlob)}
                        controls
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-white/50 flex flex-col items-center">
                        <Video className="h-12 w-12 mb-2" />
                        <p>Ready to record</p>
                    </div>
                )}

                {status === 'recording' && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold animate-pulse">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                )}
            </Card>

            <div className="flex justify-center space-x-4">
                {status === 'idle' && (
                    <Button onClick={handleStart} size="lg" className="w-full">
                        <Video className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                )}

                {status === 'recording' && (
                    <Button onClick={stopRecording} variant="destructive" size="lg" className="w-full">
                        <Square className="mr-2 h-4 w-4" /> Stop
                    </Button>
                )}

                {status === 'stopped' && (
                    <>
                        <Button onClick={resetRecording} variant="outline" disabled={isUploading}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Re-record
                        </Button>
                        <Button onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Submit Answer
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
