import React, { useState, useEffect, useRef } from 'react';
import { setPageMeta } from '../lib/head';
import { FilterSidebar } from '../components/Homepage/FilterSidebar';
import { InfiniteFeed } from '../components/Homepage/InfiniteFeed';
import { RightSidebar } from '../components/Homepage/RightSidebar';
import { useLocation } from '../context/LocationContext';
import { AIFeedSearch } from '../components/AI';
import useChat from '../hooks/useChat';
import { CommandPalette } from '../components/ui/CommandPalette';
import PersonalizedRecommendations from '../components/Personalization/PersonalizedRecommendations';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  Tag,
  Zap,
  Flame,
  Percent
} from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All Deals', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'new-arrivals', label: 'New', icon: Zap },
  { id: '50-off', label: '50%+ Off', icon: Percent },
  { id: 'under-20', label: 'Under $20', icon: Tag },
  { id: 'ending-soon', label: 'Ending Soon', icon: Clock },
];

export default function SocialHomepage() {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState(null);
  const [isAIActive, setIsAIActive] = useState(false);
  const { location } = useLocation();
  const aiInputRef = useRef(null);

  // Lift chat state here to share between the two AIFeedSearch instances
  const chatState = useChat({ streaming: true });

  useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Discover Amazing Deals & Save Big',
      description: 'Find the hottest deals, exclusive coupons, and biggest discounts.',
      canonical: window.location.origin,
    });
  }, []);

  const locationParam = location?.latitude && location?.longitude
    ? { lat: location.latitude, lng: location.longitude }
    : null;

  const handleAskAI = () => {
    setIsAIActive(true);
    // Focus the AI input after opening
    setTimeout(() => aiInputRef.current?.focus(), 100);
  };

  // Ref for main feed scroll area
  const feedRef = useRef(null);

  // Check if For You filter is active
  const isForYouActive = filter === 'for-you';

  return (
    <div className="h-screen overflow-hidden bg-surface pt-14 lg:pt-16">
      {/* Command Palette - ⌘K */}
      <CommandPalette onFilterChange={setFilter} onAskAI={handleAskAI} />

      {/* Main Content - Fluid width with 10% gaps (80% occupied) */}
      <div className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] w-[80%] mx-auto">
        <div className="flex h-full">
          {/* Left Sidebar - Compact, no scrollbar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-20 px-3 py-4 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
              <FilterSidebar
                activeFilter={filter}
                onFilterChange={setFilter}
                activeCategory={category}
                onCategoryChange={setCategory}
              />
            </div>
          </aside>

          {/* Main Feed / AI Chat */}
          <main className="flex-1 min-w-0 flex flex-col h-full">
            {/* Content Area - Feed OR Chat Messages */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto scrollbar-hide"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                willChange: 'scroll-position'
              }}
            >
              <AnimatePresence mode="wait">
                {!isAIActive ? (
                  <motion.div
                    key={isForYouActive ? "for-you-feed" : "feed"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 lg:px-8 py-6"
                  >
                    {isForYouActive ? (
                      <PersonalizedRecommendations
                        limit={24}
                        showTitle={true}
                        className=""
                      />
                    ) : (
                      <InfiniteFeed
                        filter={filter}
                        category={category}
                        location={locationParam}
                      />
                    )}
                  </motion.div>
                ) : (
                  /* Chat messages area - slides up from bottom smoothly */
                  <motion.div
                    key="ai-chat-messages"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      damping: 20,
                      mass: 0.8
                    }}
                    className="h-full"
                  >
                    <AIFeedSearch
                      onAIActive={setIsAIActive}
                      isAIActive={isAIActive}
                      showInputBar={false}
                      chatState={chatState}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Chat Input Bar - ALWAYS at same position at bottom */}
            <div className="flex-shrink-0 px-4 pb-4">
              <AIFeedSearch
                onAIActive={setIsAIActive}
                isAIActive={isAIActive}
                showOnlyInputBar={true}
                chatState={chatState}
              />
            </div>
          </main>

          {/* Right Sidebar - Wider for full info */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="sticky top-20 px-3 py-4 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
