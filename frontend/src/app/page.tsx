import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7F5] text-gray-900 font-sans relative overflow-hidden">
      {/* Background pattern placeholder */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold tracking-tighter text-green-600">LOGO</h1>
        </div>
        <div className="flex items-center space-x-8 text-sm font-medium">
          <Link href="/dashboard" className="hover:text-green-600 transition-colors">Map</Link>
          <Link href="#" className="hover:text-green-600 transition-colors">About</Link>
          <Link href="#" className="hover:text-green-600 transition-colors">Contact</Link>
          <Link href="/dashboard" className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-10 pt-20 pb-32 flex items-center min-h-[calc(100vh-100px)] relative z-10">
        <div className="w-1/2 pr-16">
          <h2 className="text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
            GHG<br />
            EMISSIONS<br />
            MAP OF GHANA
          </h2>
          <h3 className="text-xl mb-6 text-gray-700 font-medium">
            Interactive Map for Greenhouse Gas Emissions in Ghana
          </h3>
          <p className="text-gray-500 mb-10 leading-relaxed max-w-lg">
            Explore and monitor comprehensive data on greenhouse gas emissions across different regions, sectors, and time periods. This platform provides essential insights for policy makers, researchers, and analysts working towards a sustainable future.
          </p>
          <Link href="/dashboard" className="inline-block bg-green-500 text-white font-semibold px-8 py-4 rounded-md shadow-lg hover:bg-green-600 hover:shadow-xl transition-all hover:-translate-y-1">
            View Map
          </Link>

          <div className="mt-20">
            <p className="text-sm text-gray-500 mb-4 font-medium">Our Partners:</p>
            <div className="flex gap-6">
              <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500 text-xs">LOGO</div>
              <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500 text-xs">LOGO</div>
              <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500 text-xs">LOGO</div>
              <div className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center font-bold text-gray-500 text-xs">LOGO</div>
            </div>
          </div>
        </div>

        <div className="w-1/2 relative h-[600px] flex items-center justify-center">
          {/* Globe/Map Illustration Placeholder */}
          <div className="w-full h-full border border-gray-300 relative flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg shadow-2xl">
            {/* X lines to simulate wireframe image placeholder */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
               <svg className="w-full h-full stroke-gray-300" strokeWidth="1">
                  <line x1="0" y1="0" x2="100%" y2="100%" />
                  <line x1="100%" y1="0" x2="0" y2="100%" />
               </svg>
            </div>
            <span className="text-4xl font-bold tracking-widest text-gray-700 bg-white px-6 py-2 rounded shadow-sm z-10">
              GLOBE
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
