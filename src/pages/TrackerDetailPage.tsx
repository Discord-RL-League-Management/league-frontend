import { useParams } from 'react-router-dom';
import { TrackerDetail } from '../components/tracker-detail/TrackerDetail';

export default function TrackerDetailPage() {
  const { trackerId } = useParams<{ trackerId: string }>();

  if (!trackerId) {
    return <div className="p-4">Invalid tracker ID</div>;
  }

  return <TrackerDetail trackerId={trackerId} />;
}

