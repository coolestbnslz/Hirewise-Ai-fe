import { useEffect, useState } from 'react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi } from '../../api/applications';
import { screeningsApi } from '../../api/screenings';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const DebugDataPage = () => {
    const [data, setData] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            const jobs = await jobsApi.list();
            const applications = await applicationsApi.list();
            // Mock screening fetch for debug
            const screening = await screeningsApi.get('debug_id');

            setData({ jobs, applications, screening });
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold">Debug Data</h1>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Jobs Store</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-xs">
                            {JSON.stringify(data.jobs, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Applications Store</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-xs">
                            {JSON.stringify(data.applications, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DebugDataPage;
