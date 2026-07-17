import { Loader } from 'lucide-react';

export default function Spinner({ size = 24, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader size={size} className="animate-spin text-sky-500" />
    </div>
  );
}
