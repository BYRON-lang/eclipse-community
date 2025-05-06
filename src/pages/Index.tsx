
import React, { useState, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileSetupModal } from "@/components/profile/ProfileSetupModal";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate, Routes, Route } from "react-router-dom";
import ChatsPage from "./ChatsPage";
import GroupsPage from "./GroupsPage";
import GroupChatPage from "./GroupChatPage";
import CommunitiesPage from "./CommunitiesPage";
import ThreadsPage from "./ThreadsPage";
import VoicePage from "./VoicePage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Users, 
  Lock, 
  Hash, 
  Shield, 
  MessageSquare, 
  Layers, 
  CheckSquare, 
  PieChart, 
  Star 
} from "lucide-react";
import { useAuth } from "@/contexts/firebase-auth-context";

export default function Index() {
  const { user, loading, logOut } = useAuth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleAuthenticated = () => {
    setShowProfileSetup(true);
  };

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
  };

  const handleLogout = async () => {
    await logOut();
  };

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eclipse-background">
        <div className="flex flex-col items-center">
          <Clock size={40} className="text-eclipse-primary animate-pulse mb-4" />
          <p className="text-eclipse-text">Loading Eclipse Chat...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-eclipse-background">
        {/* Hero Section */}
        <div className="pt-8 px-4 md:px-8 lg:px-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={32} className="text-eclipse-primary" />
              <h1 className="text-2xl font-bold ml-2">Eclipse Chat</h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-eclipse-text"
              >
                Log In
              </Button>
              <Button 
                onClick={() => setShowLogin(true)}
                className="bg-eclipse-primary hover:bg-eclipse-primary/90"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Main Hero Content */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-20 text-center md:text-left">
            <div className="mb-6 flex items-center justify-center md:justify-start">
              <Clock size={40} className="text-eclipse-primary" />
              <h1 className="text-4xl font-bold ml-3">Eclipse Chat</h1>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-medium mb-4">Privacy-First Messaging</h2>
            
            <p className="text-eclipse-muted max-w-lg text-lg mb-8">
              Communicate with confidence through end-to-end encryption, ghost mode, and anonymity features.
              Take control of your digital conversations like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowLogin(true)}
                size="lg"
                className="bg-eclipse-primary hover:bg-eclipse-primary/90 text-lg font-medium px-8"
              >
                Get Started
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-eclipse-border bg-transparent hover:bg-eclipse-card text-eclipse-text text-lg font-medium px-8"
              >
                Learn More
              </Button>
            </div>
            
            <div className="flex items-center flex-wrap justify-center md:justify-start gap-4 mt-8">
              <div className="flex items-center space-x-2">
                <div className="bg-eclipse-card p-2 rounded-full">
                  <Lock size={16} className="text-eclipse-primary" />
                </div>
                <span className="text-sm text-eclipse-muted">End-to-End Encryption</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-eclipse-card p-2 rounded-full">
                  <Clock size={16} className="text-eclipse-primary" />
                </div>
                <span className="text-sm text-eclipse-muted">Ghost Mode Messaging</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-eclipse-card p-2 rounded-full">
                  <Shield size={16} className="text-eclipse-primary" />
                </div>
                <span className="text-sm text-eclipse-muted">Privacy Protection</span>
              </div>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="flex-1 p-6 md:p-12 flex items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <div className="h-12 w-12 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-medium mb-2">Ghost Mode</h3>
                <p className="text-eclipse-muted">
                  Messages disappear after being read, leaving no trace of sensitive conversations.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <div className="h-12 w-12 bg-eclipse-secondary/10 text-eclipse-secondary rounded-full flex items-center justify-center mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-medium mb-2">Anonymous Groups</h3>
                <p className="text-eclipse-muted">
                  Participate in group discussions without revealing your identity to other members.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <div className="h-12 w-12 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-medium mb-2">End-to-End Encryption</h3>
                <p className="text-eclipse-muted">
                  Your messages are secured with powerful encryption technology that only you and the recipient can read.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <div className="h-12 w-12 bg-eclipse-secondary/10 text-eclipse-secondary rounded-full flex items-center justify-center mb-4">
                  <Hash size={24} />
                </div>
                <h3 className="text-xl font-medium mb-2">Threaded Discussions</h3>
                <p className="text-eclipse-muted">
                  Organize conversations with threads and topic-based channels for better communication.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-16 px-6 md:px-12 bg-eclipse-card border-y border-eclipse-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">All-in-One Communication Platform</h2>
              <p className="text-eclipse-muted max-w-2xl mx-auto">
                Eclipse Chat combines the best features of messaging apps with advanced privacy controls,
                helping you maintain control over your digital conversations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">Private Messaging</h3>
                <p className="text-eclipse-muted">
                  One-on-one conversations with end-to-end encryption and optional disappearing messages.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-eclipse-secondary/10 text-eclipse-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">Group Conversations</h3>
                <p className="text-eclipse-muted">
                  Create topic-based groups with flexible privacy settings and member management.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">Community Spaces</h3>
                <p className="text-eclipse-muted">
                  Build public or private communities around shared interests with moderation tools.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Privacy Features */}
        <div className="py-16 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Advanced Privacy Features</h2>
              <p className="text-eclipse-muted max-w-2xl mx-auto">
                Take control of your digital conversations with Eclipse Chat's comprehensive privacy tools.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <Clock size={24} className="text-eclipse-primary mb-4" />
                <h3 className="font-medium mb-2">Timed Messages</h3>
                <p className="text-eclipse-muted text-sm">
                  Set messages to automatically disappear after being read or after a specified time.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <Shield size={24} className="text-eclipse-primary mb-4" />
                <h3 className="font-medium mb-2">Secure Backups</h3>
                <p className="text-eclipse-muted text-sm">
                  Opt-in encrypted backups keep your message history safe and private.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <CheckSquare size={24} className="text-eclipse-primary mb-4" />
                <h3 className="font-medium mb-2">Read Receipts Control</h3>
                <p className="text-eclipse-muted text-sm">
                  Choose when and if others can see when you've read their messages.
                </p>
              </div>
              
              <div className="bg-eclipse-card p-6 rounded-lg border border-eclipse-border">
                <PieChart size={24} className="text-eclipse-primary mb-4" />
                <h3 className="font-medium mb-2">Data Analytics Control</h3>
                <p className="text-eclipse-muted text-sm">
                  Decide what usage data is collected and how it's used.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="py-16 px-6 md:px-12 bg-eclipse-card border-y border-eclipse-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-eclipse-muted max-w-2xl mx-auto">
                Join thousands of privacy-conscious users already enjoying Eclipse Chat.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-eclipse-background p-6 rounded-lg">
                <div className="flex items-center space-x-1 mb-4">
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                </div>
                <p className="text-eclipse-text mb-4 italic">
                  "Ghost mode has been a game-changer for my sensitive work discussions. Messages disappear after reading, leaving no trace."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-eclipse-primary/10 flex items-center justify-center text-eclipse-primary font-medium">
                    JD
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Jamie D.</p>
                    <p className="text-sm text-eclipse-muted">Security Consultant</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-eclipse-background p-6 rounded-lg">
                <div className="flex items-center space-x-1 mb-4">
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                </div>
                <p className="text-eclipse-text mb-4 italic">
                  "The end-to-end encryption in Eclipse Chat gives me peace of mind when sharing sensitive information with clients."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-eclipse-primary/10 flex items-center justify-center text-eclipse-primary font-medium">
                    SM
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Sarah M.</p>
                    <p className="text-sm text-eclipse-muted">Healthcare Professional</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-eclipse-background p-6 rounded-lg">
                <div className="flex items-center space-x-1 mb-4">
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                  <Star size={16} className="fill-eclipse-primary text-eclipse-primary" />
                </div>
                <p className="text-eclipse-text mb-4 italic">
                  "I love the threaded discussions in communities - it keeps conversations organized and makes it easy to follow multiple topics."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-eclipse-primary/10 flex items-center justify-center text-eclipse-primary font-medium">
                    AL
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Alex L.</p>
                    <p className="text-sm text-eclipse-muted">Community Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="py-16 px-6 md:px-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take Control of Your Conversations?</h2>
            <p className="text-eclipse-muted mb-8 text-lg">
              Join Eclipse Chat today and experience secure, private messaging with powerful features
              designed to protect your digital privacy.
            </p>
            
            <Button
              onClick={() => setShowLogin(true)}
              size="lg"
              className="bg-eclipse-primary hover:bg-eclipse-primary/90 text-lg font-medium px-8"
            >
              Create Free Account
            </Button>
            
            <p className="mt-4 text-sm text-eclipse-muted">
              No credit card required. Free plan available with premium upgrades.
            </p>
          </div>
        </div>
        
        <footer className="border-t border-eclipse-border py-8 px-4 text-center text-sm text-eclipse-muted">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center space-x-2 mb-6">
              <Clock size={20} className="text-eclipse-primary" />
              <p className="text-lg font-medium">Eclipse Chat</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6">
              <a href="#" className="hover:text-eclipse-text">Features</a>
              <a href="#" className="hover:text-eclipse-text">Privacy</a>
              <a href="#" className="hover:text-eclipse-text">Security</a>
              <a href="#" className="hover:text-eclipse-text">Communities</a>
              <a href="#" className="hover:text-eclipse-text">Support</a>
              <a href="#" className="hover:text-eclipse-text">Blog</a>
            </div>
            
            <p>Eclipse Chat © 2025 — Privacy by Design</p>
          </div>
        </footer>
        
        <AuthModal 
          open={showLogin} 
          onOpenChange={setShowLogin} 
          onAuthenticated={handleAuthenticated} 
        />
      </div>
    );
  }

  // If authenticated, show app layout with routes
  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/chats" replace />} />
          <Route path="chats" element={<ChatsPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="group/:groupId" element={<GroupChatPage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="threads" element={<ThreadsPage />} />
          <Route path="voice" element={<VoicePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      
      <ProfileSetupModal 
        open={showProfileSetup} 
        onOpenChange={setShowProfileSetup}
        onComplete={handleProfileSetupComplete}
      />
    </>
  );
}
