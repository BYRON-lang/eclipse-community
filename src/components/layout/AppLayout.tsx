
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/firebase-auth-context";
import { updateOnlinePresence } from "@/services/chat-service";

interface AppLayoutProps {
  onLogout: () => void;
}

export function AppLayout({ onLogout }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default to collapsed
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }
  }, []);
  
  // Update online presence when user is authenticated
  useEffect(() => {
    if (user) {
      // Set user as online
      updateOnlinePresence(true);
      
      // Set user as offline when page closes
      const handleBeforeUnload = () => {
        updateOnlinePresence(false);
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateOnlinePresence(false);
      };
    }
  }, [user]);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-eclipse-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onLogout={onLogout}
        />
      )}
      
      {/* Mobile sidebar (off-canvas) */}
      {isMobile && mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div 
            className="w-64 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              collapsed={false}
              onCollapsedChange={() => {}}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {isMobile && (
          <div className="flex items-center h-14 px-4 bg-eclipse-card border-b border-eclipse-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileSidebar}
              className="mr-4 text-eclipse-text"
            >
              <Menu size={22} />
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-medium">Eclipse Chat</h1>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
