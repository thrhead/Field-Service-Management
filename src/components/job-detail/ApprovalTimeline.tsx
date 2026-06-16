export const ApprovalTimeline = ({ history }: { history: any[] }) => {
    return (
        <div className="space-y-4">
            {history.map((item, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-4">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.user} • {item.date}</p>
                        {item.duration && <p className="text-xs text-blue-600 font-bold">Süre: {item.duration}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};
