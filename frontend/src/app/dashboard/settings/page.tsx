import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="absolute left-[60px] right-0 top-[72px] bottom-0 flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-5">
          <Settings className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Settings</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Configure data sources, notification preferences, and API access. Coming soon.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-xs font-semibold text-[#00C853] hover:underline">
          ← Back to Map
        </Link>
      </div>
    </div>
  );
}
