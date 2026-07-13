import DashboardNav from '@/components/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden relative font-sans bg-[#F1F5F9]">
      {children}
    </div>
  );
}
