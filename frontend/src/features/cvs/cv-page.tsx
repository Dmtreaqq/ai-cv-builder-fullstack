import { useParams } from 'react-router';
import { CvLoader } from './cv-loader';

export function CvPage() {
  const { id = '' } = useParams();
  return <CvLoader key={id} id={id} />;
}
