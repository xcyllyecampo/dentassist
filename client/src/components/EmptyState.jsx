import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <Icon size={48} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
