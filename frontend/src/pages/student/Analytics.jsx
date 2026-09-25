import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/useApi';
import AnalyticsView from '../../components/AnalyticsView';
import { ErrorState, PageHeader, PageLoader } from '../../components/ui';
import { tz } from '../../lib/format';

export default function Analytics() {
    useDocumentTitle('Analytics');
    const { data, error, loading, reload } = useApi(`/analytics/me?tz=${tz()}`);
    if (loading) return <PageLoader />;
    if (error) return <ErrorState error={error} onRetry={reload} />;
    return (
        <div>
            <PageHeader title="Analytics" subtitle="How you're performing, where you're losing marks, and how it's changing."
                actions={<Link to="/app/plan" className="btn btn-primary"><Sparkles size={16} /> Get my study plan</Link>} />
            <AnalyticsView a={data.analytics} />
        </div>
    );
}
