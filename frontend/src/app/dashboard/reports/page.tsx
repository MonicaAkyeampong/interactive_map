import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="absolute inset-0 pl-[76px] flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-5">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Reports</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Generate and export regional emission reports for policy briefs and UNFCCC submissions. Coming soon.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-xs font-semibold text-[#00C853] hover:underline">
          ← Back to Map
        </Link>
      </div>
    </div>
  );
}
