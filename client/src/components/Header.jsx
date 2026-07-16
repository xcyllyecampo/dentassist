import { useAuth } from '../context/AuthContext';
import { Bell, Search } from 'lucide-react';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-sky-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-sky-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={16} />
          <input
            type="text"
            placeholder="Search patients, appointments..."
            className="pl-10 pr-4 py-2 bg-sky-50 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-64"
          />
        </div>
        <button className="relative p-2 text-sky-600 hover:bg-sky-50 rounded-lg">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
