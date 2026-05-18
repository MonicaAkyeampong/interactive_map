import Map from '@/components/Map';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function Dashboard() {
  return (
    <div className="h-screen w-screen overflow-hidden relative font-sans bg-[#F5F7F5]">
      <Map />
      <TopBar />
      <Sidebar />
    </div>
  );
}
