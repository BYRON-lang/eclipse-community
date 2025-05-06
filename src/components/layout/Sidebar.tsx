
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Users,
  Globe,
  Hash,
  Headphones,
  User,
  Settings,
  Clock,
  LogOut,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onLogout: () => void;
}

export function Sidebar({
  collapsed = true, // Changed default to true
  onCollapsedChange,
  onLogout,
}: SidebarProps) {
  // Store initial collapse state in localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null && onCollapsedChange) {
      onCollapsedChange(savedCollapsed === "true");
    }
  }, [onCollapsedChange]);

  // Save collapse state to localStorage
  const handleCollapsedChange = (newCollapsed: boolean) => {
    localStorage.setItem("sidebarCollapsed", String(newCollapsed));
    onCollapsedChange?.(newCollapsed);
  };

  const navItems = [
    {
      icon: MessageCircle,
      label: "Chats",
      to: "/chats",
      badge: 2,
    },
    {
      icon: Users,
      label: "Groups",
      to: "/groups",
    },
    {
      icon: Globe,
      label: "Communities",
      to: "/communities",
    },
    {
      icon: Hash,
      label: "Threads",
      to: "/threads",
    },
    {
      icon: Headphones,
      label: "Voice Lounge",
      to: "/voice",
      soon: true,
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-eclipse-card border-r border-eclipse-border h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-eclipse-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Clock size={24} className="text-eclipse-primary" />
            <h1 className="text-xl font-medium">Eclipse</h1>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Clock size={26} className="text-eclipse-primary" />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="text-eclipse-muted hover:text-eclipse-text hover:bg-eclipse-background"
            onClick={() => handleCollapsedChange(!collapsed)}
          >
            <Moon size={18} />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto hide-scrollbar py-4">
        <ul className="space-y-1 px-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <li key={item.to}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          isActive
                            ? "bg-eclipse-primary/10 text-eclipse-primary"
                            : "text-eclipse-muted hover:text-eclipse-text hover:bg-eclipse-background"
                        )
                      }
                    >
                      <item.icon
                        size={collapsed ? 22 : 18}
                        className={collapsed ? "mx-auto" : ""}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="ml-auto bg-eclipse-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {!collapsed && item.soon && (
                        <span className="ml-auto bg-eclipse-border text-eclipse-muted text-xs px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-eclipse-card border-eclipse-border text-eclipse-text">
                      <div className="flex items-center">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 bg-eclipse-primary text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.soon && (
                          <span className="ml-2 bg-eclipse-border text-eclipse-muted text-xs px-1.5 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            ))}
          </TooltipProvider>
        </ul>

        {/* Push profile and settings to the bottom */}
        <div className="flex-1"></div>

        <ul className="space-y-1 px-2">
          <TooltipProvider delayDuration={0}>
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-eclipse-primary/10 text-eclipse-primary"
                          : "text-eclipse-muted hover:text-eclipse-text hover:bg-eclipse-background"
                      )
                    }
                  >
                    <User
                      size={collapsed ? 22 : 18}
                      className={collapsed ? "mx-auto" : ""}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">Profile</span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-eclipse-card border-eclipse-border text-eclipse-text">
                    Profile
                  </TooltipContent>
                )}
              </Tooltip>
            </li>

            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                        isActive
                          ? "bg-eclipse-primary/10 text-eclipse-primary"
                          : "text-eclipse-muted hover:text-eclipse-text hover:bg-eclipse-background"
                      )
                    }
                  >
                    <Settings
                      size={collapsed ? 22 : 18}
                      className={collapsed ? "mx-auto" : ""}
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">Settings</span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-eclipse-card border-eclipse-border text-eclipse-text">
                    Settings
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
          </TooltipProvider>
        </ul>
      </nav>

      <div className="p-4 border-t border-eclipse-border">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {collapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="text-eclipse-muted hover:text-eclipse-danger hover:bg-eclipse-background mx-auto"
                >
                  <LogOut size={20} />
                </Button>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 border border-eclipse-border">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-eclipse-text bg-eclipse-background">
                        EU
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">Eclipse User</p>
                      <p className="text-xs text-eclipse-muted">Online</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    className="text-eclipse-muted hover:text-eclipse-danger hover:bg-eclipse-background"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              )}
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-eclipse-card border-eclipse-border text-eclipse-text">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 border border-eclipse-border">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-eclipse-text bg-eclipse-background">
                      EU
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Eclipse User</p>
                    <p className="text-xs text-eclipse-muted">Online</p>
                  </div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
