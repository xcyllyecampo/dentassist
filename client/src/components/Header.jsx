import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Header({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-sky-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-sky-50 rounded-lg text-sky-600">
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-sky-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
