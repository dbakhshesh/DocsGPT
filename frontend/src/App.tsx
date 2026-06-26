import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Conversation from './conversation/Conversation';
import About from './About';
import MarketplaceApp from './marketplace/MarketplaceApp';
import { useState } from 'react';
import { ActiveState } from './models/misc';
import { inject } from '@vercel/analytics';

inject();

export default function App() {
  const location = useLocation();
  const isMarketplace = location.pathname.startsWith('/marketplace');

  //TODO : below media query is disjoint from tailwind. Please wire it together.
  const [navState, setNavState] = useState<ActiveState>(
    window.matchMedia('(min-width: 768px)').matches ? 'ACTIVE' : 'INACTIVE',
  );

  if (isMarketplace) {
    return (
      <Routes>
        <Route path="/marketplace/*" element={<MarketplaceApp />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-full min-w-full">
      <Navigation navState={navState} setNavState={setNavState} />
      <div
        className={`transition-all duration-200 ${
          navState === 'ACTIVE' ? 'ml-0 md:ml-72 lg:ml-60' : 'ml-0 md:ml-16'
        }`}
      >
        <Routes>
          <Route path="/" element={<Conversation />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </div>
  );
}
