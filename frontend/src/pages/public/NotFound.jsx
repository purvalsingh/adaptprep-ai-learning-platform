import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useDocumentTitle } from '../../lib/useApi';
import { Empty } from '../../components/ui';

export default function NotFound({ inApp }) {
    useDocumentTitle('Page not found');
    return (
        <div style={{ minHeight: inApp ? '60vh' : '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
            <Empty icon={Compass} title="We couldn't find that page" action={<Link to={inApp ? '/app' : '/'} className="btn btn-primary">{inApp ? 'Back to dashboard' : 'Go home'}</Link>}>
                The link may be broken, or you may not have access to it.
            </Empty>
        </div>
    );
}
