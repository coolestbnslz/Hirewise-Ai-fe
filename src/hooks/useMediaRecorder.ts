import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'stopped'>('idle');
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);

            const recorder = new MediaRecorder(mediaStream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setMediaBlob(blob);
                mediaStream.getTracks().forEach(track => track.stop());
                setStream(null);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setStatus('recording');
            setError(null);
        } catch (err) {
            setError('Could not access camera/microphone');
            console.error(err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setStatus('stopped');
        }
    }, []);

    const resetRecording = useCallback(() => {
        setMediaBlob(null);
        setStatus('idle');
        setError(null);
    }, []);

    return { status, startRecording, stopRecording, resetRecording, mediaBlob, error, stream };
};
