import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ChatSession } from '@/lib/types';
import { UserMenu } from '@/components/user-menu';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  userEmail?: string;
  userName?: string;
  onSettings?: () => void;
}

const SidebarToggleIcon = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5.4541C8 5.42548 8.00155 5.39716 8.00391 5.36914C7.55522 5.37527 7.18036 5.38745 6.85449 5.41406C6.32513 5.45732 5.99243 5.53344 5.74121 5.6416L5.6377 5.69043C5.14381 5.94215 4.73058 6.32494 4.44238 6.79492L4.32715 7.00098C4.19296 7.26434 4.10023 7.61261 4.05078 8.21777C4.00041 8.83458 4 9.62723 4 10.7637V13.2363C4 14.3728 4.00039 15.1654 4.05078 15.7822C4.10023 16.3871 4.19298 16.7347 4.32715 16.998L4.44238 17.2041C4.73056 17.6741 5.14377 18.0568 5.6377 18.3086L5.74121 18.3574C5.99244 18.4656 6.32506 18.5417 6.85449 18.585C7.17941 18.6115 7.55304 18.6228 8 18.6289V5.4541ZM22 13.2363C22 14.3396 22.001 15.2273 21.9424 15.9443C21.8903 16.5821 21.7876 17.1524 21.5605 17.6816L21.4551 17.9063C20.9758 18.8468 20.211 19.6115 19.2705 20.0908C18.6783 20.3925 18.0373 20.5186 17.3086 20.5781C16.5914 20.6367 15.7032 20.6357 14.5996 20.6357H9.40039C9.27572 20.6357 9.15341 20.6339 9.03418 20.6338C9.02282 20.6342 9.01146 20.6357 9 20.6357C8.98557 20.6357 8.97131 20.6334 8.95703 20.6328C8.05556 20.632 7.31 20.6287 6.69141 20.5781C6.05356 20.526 5.48347 20.4235 4.9541 20.1963L4.73047 20.0908C3.84834 19.6413 3.12017 18.9412 2.6377 18.0801L2.54492 17.9063C2.24315 17.3139 2.11717 16.6732 2.05762 15.9443C1.99905 15.2273 2 14.3396 2 13.2363V10.7637C2 9.66008 1.99903 8.77186 2.05762 8.05469C2.11716 7.32598 2.24327 6.68595 2.54492 6.09375L2.6377 5.91895C3.12017 5.05789 3.8484 4.35763 4.73047 3.9082L4.9541 3.80274C5.48344 3.57561 6.05359 3.47301 6.69141 3.4209C7.40857 3.36231 8.29681 3.36328 9.40039 3.36328H14.5996C15.7032 3.36328 16.5914 3.36231 17.3086 3.4209C18.0373 3.48044 18.6773 3.60656 19.2695 3.9082L19.4443 4.00195C20.3052 4.48442 21.0057 5.21184 21.4551 6.09375L21.5605 6.31738C21.7877 6.84672 21.8903 7.41688 21.9424 8.05469C22.001 8.77186 22 9.66008 22 10.7637V13.2363ZM10 18.6357H14.5996C15.7361 18.6357 16.5287 18.6353 17.1455 18.585C17.7507 18.5355 18.0989 18.4428 18.3623 18.3086L18.5684 18.1934C19.0383 17.9051 19.4211 17.492 19.6729 16.998L19.7217 16.8945C19.8298 16.6434 19.906 16.3112 19.9492 15.7822C19.9996 15.1654 20 14.3728 20 13.2363V10.7637C20 9.62722 19.9996 8.83458 19.9492 8.21777C19.906 7.68841 19.8299 7.35572 19.7217 7.10449L19.6729 7.00098C19.4211 6.50707 19.0383 6.09385 18.5684 5.80567L18.3623 5.69043C18.0989 5.55623 17.7507 5.46351 17.1455 5.41406C16.5287 5.36369 15.736 5.36328 14.5996 5.36328H9.99609C9.99879 5.39319 10 5.42349 10 5.4541V18.6357Z" />
  </svg>
)

const NewChatIcon = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7.5271 4.5 4 7.91095 4 12C4 13.6958 4.5996 15.263 5.62036 16.5254C5.80473 16.7534 5.87973 17.0509 5.82551 17.339C5.72928 17.8505 5.60336 18.3503 5.45668 18.8401C6.08722 18.743 6.69878 18.6098 7.2983 18.4395C7.54758 18.3687 7.81461 18.3975 8.04312 18.5197C9.20727 19.1423 10.5566 19.5 12 19.5C16.4729 19.5 20 16.0891 20 12C20 7.91095 16.4729 4.5 12 4.5ZM2 12C2 6.70021 6.53177 2.5 12 2.5C17.4682 2.5 22 6.70021 22 12C22 17.2998 17.4682 21.5 12 21.5C10.3694 21.5 8.82593 21.1286 7.46141 20.4675C6.36717 20.7507 5.2423 20.9253 4.06155 20.9981C3.72191 21.019 3.39493 20.8658 3.19366 20.5915C2.9924 20.3171 2.94448 19.9592 3.06647 19.6415C3.35663 18.8859 3.6004 18.1448 3.77047 17.399C2.65693 15.8695 2 14.0088 2 12ZM12 8C12.5523 8 13 8.44772 13 9V11H15C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13H13V15C13 15.5523 12.5523 16 12 16C11.4477 16 11 15.5523 11 15V13H9C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11H11V9C11 8.44772 11.4477 8 12 8Z" fill="currentColor" />
  </svg>
)

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onNewChat, 
  onSelectChat, 
  isCollapsed, 
  toggleSidebar,
  userEmail,
  userName,
  onSettings
}) => {
  // Shared inner content — wrapped in a proper flex-col h-full div so flex-1 works
  const ExpandedContent = () => (
    <div className="flex flex-col h-full w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <button 
          onClick={toggleSidebar} 
          className="p-2 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] rounded-lg text-gray-500 dark:text-[#8A8A8D] focus:outline-none focus:ring-0 focus:border-none active:outline-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <SidebarToggleIcon size={20} />
        </button>
      </div>

      {/* New chat button */}
      <button 
        onClick={onNewChat}
        className="w-full bg-white border-0 text-gray-900 hover:bg-gray-100 dark:bg-[#2c2c2e] dark:border-0 dark:text-white dark:hover:bg-[#3a3a3c] rounded-[1rem] py-3 px-4 flex items-center gap-2 mb-4 transition-colors flex-shrink-0"
      >
        <NewChatIcon size={20} />
        <span className="text-sm font-medium">Nowa rozmowa</span>
      </button>

      {/* Sessions list — flex-1 + min-h-0 so it scrolls correctly */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {sessions.filter(s => Date.now() - s.updatedAt < 86400000).length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-[#8A8A8D] uppercase px-3 mb-2">Dzisiaj</h3>
            <div className="space-y-1">
              {sessions.filter(s => Date.now() - s.updatedAt < 86400000).map(session => (
                <button
                  key={session.id}
                  onClick={() => onSelectChat(session.id)}
                  className={`w-full group px-3 py-2.5 rounded-[1rem] text-left text-sm flex items-center justify-between transition-colors ${
                    activeSessionId === session.id 
                      ? 'bg-[#f2f2f2] text-black dark:bg-[#2c2c2e] dark:text-white' 
                      : 'text-gray-700 hover:bg-gray-200 dark:text-[#8A8A8D] dark:hover:bg-[#212121]'
                  }`}
                >
                  <span className="truncate flex-1">{session.title}</span>
                  <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-500 dark:text-[#8A8A8D]" />
                </button>
              ))}
            </div>
          </section>
        )}

        {sessions.filter(s => {
          const diff = Date.now() - s.updatedAt;
          return diff >= 86400000 && diff < 86400000 * 7;
        }).length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-[#8A8A8D] uppercase px-3 mb-2">7 dni</h3>
            <div className="space-y-1">
              {sessions.filter(s => {
                const diff = Date.now() - s.updatedAt;
                return diff >= 86400000 && diff < 86400000 * 7;
              }).map(session => (
                <button
                  key={session.id}
                  onClick={() => onSelectChat(session.id)}
                  className={`w-full group px-3 py-2.5 rounded-[1rem] text-left text-sm flex items-center justify-between transition-colors ${
                    activeSessionId === session.id 
                      ? 'bg-[#f2f2f2] text-black dark:bg-[#2c2c2e] dark:text-white' 
                      : 'text-gray-700 hover:bg-gray-200 dark:text-[#8A8A8D] dark:hover:bg-[#212121]'
                  }`}
                >
                  <span className="truncate flex-1">{session.title}</span>
                  <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-500 dark:text-[#8A8A8D]" />
                </button>
              ))}
            </div>
          </section>
        )}

        {sessions.filter(s => Date.now() - s.updatedAt >= 86400000 * 7).length > 0 && (
          <section>
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-[#8A8A8D] uppercase px-3 mb-2">Starsze</h3>
            <div className="space-y-1">
              {sessions.filter(s => Date.now() - s.updatedAt >= 86400000 * 7).map(session => (
                <button
                  key={session.id}
                  onClick={() => onSelectChat(session.id)}
                  className={`w-full group px-3 py-2.5 rounded-[1rem] text-left text-sm flex items-center justify-between transition-colors ${
                    activeSessionId === session.id 
                      ? 'bg-[#f2f2f2] text-black dark:bg-[#2c2c2e] dark:text-white' 
                      : 'text-gray-700 hover:bg-gray-200 dark:text-[#8A8A8D] dark:hover:bg-[#212121]'
                  }`}
                >
                  <span className="truncate flex-1">{session.title}</span>
                  <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-gray-500 dark:text-[#8A8A8D]" />
                </button>
              ))}
            </div>
          </section>
        )}

        {sessions.length === 0 && (
          <div className="px-3 py-4 text-xs text-gray-400 dark:text-[#8A8A8D]">
            Brak historii rozmów
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-[#2c2c2e]">
        <UserMenu
          name={userName || 'User'}
          email={userEmail || 'user@example.com'}
          initials={(userName || 'U').charAt(0).toUpperCase()}
          onSignOut={() => console.log('Sign out clicked')}
          onSettings={onSettings}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE OVERLAY */}
      {/* Backdrop — brak onClick, sidebar zamyka się tylko przez przycisk toggle */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          !isCollapsed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Mobile Drawer — full height, flex-col */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#f9fafb] dark:bg-[#1b1b1c] border-r border-gray-200 dark:border-[#2c2c2e] flex flex-col p-3 transition-transform duration-300 md:hidden ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <ExpandedContent />
      </div>

      {/* DESKTOP (hidden on mobile) */}
      <div 
        className={`hidden md:flex flex-col h-screen bg-[#f9fafb] dark:bg-[#1b1b1c] border-r border-gray-200 dark:border-[#2c2c2e] transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-16' : 'w-[260px]'
        }`}
      >
        <div className={`flex flex-col h-full w-[260px] p-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
          <ExpandedContent />
        </div>
        
        <div className={`flex flex-col items-center py-3 space-y-4 w-16 h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
          <button 
            onClick={toggleSidebar} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] rounded-lg text-gray-500 dark:text-[#8A8A8D] focus:outline-none focus:ring-0 focus:border-none active:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <SidebarToggleIcon size={20} />
          </button>
          <button 
            onClick={onNewChat} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] rounded-lg text-gray-500 dark:text-[#8A8A8D] focus:outline-none focus:ring-0 focus:border-none active:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <NewChatIcon size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
