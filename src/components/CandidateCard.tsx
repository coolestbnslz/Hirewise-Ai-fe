import { type Application, applicationsApi } from '../api/applications';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface CandidateCardProps {
    application: Application;
    onClose: () => void;
    onUpdate: () => void;
}

export const CandidateCard = ({ application, onClose, onUpdate }: CandidateCardProps) => {
    const handleApprove = async () => {
        await applicationsApi.approveLevel1(application.id);
        onUpdate();
        onClose();
    };

    const handleReject = async () => {
        await applicationsApi.reject(application.id);
        onUpdate();
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{application.candidateName}</h2>
                    <p className="text-muted-foreground">{application.email}</p>
                </div>
                <div className={`text-xl font-bold ${application.alignmentScore >= 80 ? 'text-green-500' : application.alignmentScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {application.alignmentScore}% Match
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {application.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {tag}
                    </span>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resume Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{application.resumePreview}</p>
                </CardContent>
            </Card>

            {application.screeningId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Video Screening</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Screening completed. <a href="#" className="text-primary hover:underline">View Recording</a></p>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="destructive" onClick={handleReject}>Reject</Button>
                <Button onClick={handleApprove}>Approve Level 1</Button>
            </div>
        </div>
    );
};
