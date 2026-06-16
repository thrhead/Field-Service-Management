export const JobSummaryMetrics = ({ metrics }: { metrics: { totalTime: string; status: string } }) => {
    return (
        <div className="flex gap-4 p-4 border rounded-lg">
            <div>
                <p className="text-sm text-gray-500">Total Time</p>
                <p className="text-lg font-bold">{metrics.totalTime}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-bold">{metrics.status}</p>
            </div>
        </div>
    );
};
