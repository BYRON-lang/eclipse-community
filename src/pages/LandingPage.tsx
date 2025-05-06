
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-eclipse-primary/5 to-eclipse-background">
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <header className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-eclipse-primary text-white flex items-center justify-center text-xl font-bold">E</div>
            <h1 className="ml-2 text-2xl font-bold">Eclipse</h1>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => navigate('/signin')}>Sign In</Button>
            <Button onClick={() => navigate('/signup')}>Sign Up</Button>
          </div>
        </header>
        
        <main className="py-16">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Connect. Share. Discover.</h2>
            <p className="text-xl text-eclipse-muted mb-10">
              Join Eclipse, the modern social platform where privacy meets connectivity. 
              Share threads, join communities, and explore new interests in a secure environment.
            </p>
            <Button size="lg" className="px-8 py-6 rounded-full text-lg" onClick={() => navigate('/signup')}>
              Get Started <ChevronRight className="ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-24">
            <div className="bg-white dark:bg-eclipse-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meaningful Connections</h3>
              <p className="text-eclipse-muted">
                Build genuine relationships with others who share your interests and passions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-eclipse-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 16-8.5-8.5A7 7 0 1 0 4.5 14.4V20a2 2 0 0 0 2 2h5.7a7 7 0 0 0 4.9-2.1l4.9-5.3a1 1 0 0 0 0-1.4Z"/><circle cx="9" cy="9" r="2"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-eclipse-muted">
                With Ghost Mode and end-to-end encryption, take control of your digital footprint.
              </p>
            </div>
            
            <div className="bg-white dark:bg-eclipse-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-eclipse-primary/10 text-eclipse-primary rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 6A5 5 0 0 1 1 6c0 2.5 2 5 5 5 3 0 5-2.5 5-5"/><path d="M17 14a5 5 0 1 0 0 2"/><path d="M11 18a5 5 0 0 1-10 0c0-2.5 2-5 5-5 3 0 5 2.5 5 5"/><path d="M23 6a5 5 0 0 0-10 0c0 2.5 2 5 5 5 3 0 5-2.5 5-5"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Vibrant Communities</h3>
              <p className="text-eclipse-muted">
                Discover and join communities around topics you care about and engage with like-minded people.
              </p>
            </div>
          </div>
          
          <div className="my-24 bg-white dark:bg-eclipse-card rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Eclipse?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex">
                <div className="mr-4 text-eclipse-primary">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Ghost Mode</h3>
                  <p className="text-eclipse-muted">Messages that disappear after being read, giving you complete control over your conversations.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 text-eclipse-primary">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">End-to-End Encryption</h3>
                  <p className="text-eclipse-muted">Your messages and media are encrypted from sender to recipient, ensuring privacy.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 text-eclipse-primary">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Rich Media Sharing</h3>
                  <p className="text-eclipse-muted">Share photos, videos, and polls with optimized loading for smooth experience.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 text-eclipse-primary">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Custom Communities</h3>
                  <p className="text-eclipse-muted">Create public or private communities with specific settings and member management.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-eclipse-primary rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8">Join thousands of users already experiencing Eclipse.</p>
            <Button variant="outline" size="lg" className="bg-white text-eclipse-primary hover:bg-white/90 px-8" onClick={() => navigate('/signup')}>
              Create Your Account
            </Button>
          </div>
        </main>
        
        <footer className="py-10 border-t border-eclipse-border mt-20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-eclipse-primary text-white flex items-center justify-center text-lg font-bold">E</div>
              <p className="ml-2 text-sm text-eclipse-muted">© 2025 Eclipse. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-eclipse-muted hover:text-eclipse-primary">Privacy Policy</a>
              <a href="#" className="text-sm text-eclipse-muted hover:text-eclipse-primary">Terms of Service</a>
              <a href="#" className="text-sm text-eclipse-muted hover:text-eclipse-primary">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
