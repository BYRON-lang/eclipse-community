
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Hash, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  Thread,
  getThreadsForUser,
  getTrendingThreads,
  getSuggestedUsers,
  toggleThreadLike,
  toggleThreadBookmark,
  followUser,
  reportUser,
  blockUser,
  getUserProfile,
  UserProfile,
  createThread,
  shareThread
} from "@/services/thread-service";

// Import new components
import { ThreadCard } from "@/components/thread/ThreadCard";
import { ThreadComposer } from "@/components/thread/ThreadComposer";
import { ThreadDetail } from "@/components/thread/ThreadDetail";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TrendingTag {
  name: string;
  threadCount: number;
}

interface SuggestedUser {
  id: string;
  displayName: string;
  photoURL?: string;
  username?: string;
  bio?: string;
  verified?: boolean;
}

export default function ThreadsPage() {
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"threads" | "bookmarks">("threads");
  const [searchQuery, setSearchQuery] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportedUserId, setReportedUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadDetailOpen, setThreadDetailOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll events to show/hide header
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current) return;
      
      const currentScrollY = mainContentRef.current.scrollTop;
      const scrollDelta = currentScrollY - lastScrollY;
      const scrollingDown = scrollDelta > 0;
      
      // Only update header visibility if scroll direction changes or at top/bottom
      if (scrollingDown !== !isHeaderVisible || currentScrollY <= 0) {
        setIsHeaderVisible(!scrollingDown || currentScrollY <= 0);
      }
      
      setLastScrollY(currentScrollY);
    };

    const contentElement = mainContentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY, isHeaderVisible]);

  useEffect(() => {
    // Get current user profile
    if (auth.currentUser) {
      getUserProfile(auth.currentUser.uid)
        .then(profile => {
          setUserProfile(profile);
        })
        .catch(error => {
          console.error("Error fetching profile:", error);
        });
    }

    // Get threads for the user
    const unsubscribe = getThreadsForUser((fetchedThreads) => {
      setThreads(fetchedThreads);
    });

    // Extract trending tags from threads
    const extractTrendingTags = async () => {
      const trendingThreads = await getTrendingThreads(20);
      const tagCounts: Record<string, number> = {};
      
      trendingThreads.forEach(thread => {
        thread.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const sortedTags = Object.entries(tagCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([name, threadCount]) => ({ name, threadCount }));
      
      setTrendingTags(sortedTags);
    };
    
    extractTrendingTags();
    
    // Load suggested users
    getSuggestedUsers(5).then(users => {
      setSuggestedUsers(users.map(user => ({
        id: user.id,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        username: user.username || 'user',
        bio: user.bio || '',
        verified: user.verified || false
      })));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleLike = async (threadId: string) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like threads",
        variant: "destructive"
      });
      return;
    }

    try {
      const isLiked = await toggleThreadLike(threadId);
      
      setThreads(threads.map(thread =>
        thread.id === threadId
          ? { 
              ...thread, 
              isLiked, 
              likeCount: isLiked ? thread.likeCount + 1 : thread.likeCount - 1 
            }
          : thread
      ));
      
      // Also update selected thread if it's the one being liked
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? {
            ...prev,
            isLiked,
            likeCount: isLiked ? prev.likeCount + 1 : prev.likeCount - 1
          } : null
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to like thread. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleBookmark = async (threadId: string) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark threads",
        variant: "destructive"
      });
      return;
    }

    try {
      const isBookmarked = await toggleThreadBookmark(threadId);
      
      setThreads(threads.map(thread =>
        thread.id === threadId
          ? { ...thread, isBookmarked }
          : thread
      ));
      
      // Also update selected thread if it's the one being bookmarked
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? {
            ...prev,
            isBookmarked
          } : null
        );
      }

      toast({
        title: isBookmarked ? "Thread bookmarked" : "Bookmark removed",
        description: isBookmarked 
          ? "Thread added to your bookmarks" 
          : "Thread removed from your bookmarks"
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to bookmark thread. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }

    try {
      await followUser(userId);
      
      // Remove user from suggested list
      setSuggestedUsers(suggestedUsers.filter(user => user.id !== userId));
      
      // Update thread authors to show they're now verified if they reach the threshold
      setThreads(threads.map(thread => 
        thread.authorId === userId && !thread.verified ? { ...thread, verified: true } : thread
      ));
      
      toast({
        title: "User followed",
        description: "You are now following this user"
      });
      
      // Refresh user profile to update following count
      if (auth.currentUser) {
        const updatedProfile = await getUserProfile(auth.currentUser.uid);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReportUser = (userId: string) => {
    setReportedUserId(userId);
    setIsReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportReason || !reportedUserId) return;
    
    try {
      await reportUser(reportedUserId, reportReason);
      setIsReportDialogOpen(false);
      setReportReason("");
      setReportedUserId("");
      
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe"
      });
    } catch (error) {
      console.error("Error reporting user:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await blockUser(userId);
      
      // Remove user's threads from the list
      setThreads(threads.filter(thread => thread.authorId !== userId));
      
      toast({
        title: "User blocked",
        description: "You will no longer see content from this user"
      });
      
      // Close thread detail if it's from the blocked user
      if (selectedThread?.authorId === userId) {
        setThreadDetailOpen(false);
        setSelectedThread(null);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateThread = async (
    content: string,
    tags: string[],
    media: File[],
    isPoll: boolean,
    pollOptions: string[],
    pollDuration: number
  ) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create threads",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createThread(content, tags, media, isPoll, pollOptions, pollDuration);
      
      toast({
        title: "Thread created",
        description: "Your thread has been posted successfully"
      });
      
      // No need to manually refresh threads as the listener will pick up the new thread
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleShareThread = async (threadId: string) => {
    try {
      // Copy thread link to clipboard
      const threadLink = `${window.location.origin}/thread/${threadId}`;
      await navigator.clipboard.writeText(threadLink);
      
      // Update share count in the database
      await shareThread(threadId);
      
      // Update UI optimistically
      setThreads(threads.map(thread => 
        thread.id === threadId 
          ? { ...thread, shareCount: (thread.shareCount || 0) + 1 } 
          : thread
      ));
      
      // Also update selected thread if it's the one being shared
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => 
          prev ? {
            ...prev,
            shareCount: (prev.shareCount || 0) + 1
          } : null
        );
      }
      
      toast({
        title: "Link copied",
        description: "Thread link copied to clipboard"
      });
    } catch (error) {
      console.error("Error sharing thread:", error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setSelectedThread(thread);
      setThreadDetailOpen(true);
    }
  };

  // Filter threads based on active tab and search query
  const filteredThreads = threads.filter(thread => 
    (activeTab === "threads" || (activeTab === "bookmarks" && thread.isBookmarked)) &&
    (searchQuery === "" || 
      thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Mobile view (1-column layout)
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        {/* Header with search */}
        <div
          ref={headerRef}
          className={cn(
            "sticky top-0 z-50 p-4 border-b border-eclipse-border flex flex-col gap-4 bg-eclipse-card transition-transform duration-200 ease-in-out",
            !isHeaderVisible && "-translate-y-full"
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Hash size={20} className="text-eclipse-primary mr-2" />
              <h1 className="text-lg font-medium">Threads</h1>
            </div>
          </div>

          {/* Thread composer */}
          <ThreadComposer 
            onSubmit={handleCreateThread} 
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Search & tabs */}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-eclipse-muted" />
            <Input 
              placeholder="Search threads" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-eclipse-background border-eclipse-border" 
            />
          </div>
          
          <div className="flex justify-center space-x-2 mb-4">
            <Button 
              variant={activeTab === "threads" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("threads")}
              className={cn(
                activeTab === "threads" ? "bg-eclipse-primary" : "",
                "flex-1 max-w-[140px] h-10 text-base"
              )}
            >
              All
            </Button>
            <Button 
              variant={activeTab === "bookmarks" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("bookmarks")}
              className={cn(
                activeTab === "bookmarks" ? "bg-eclipse-primary" : "",
                "flex-1 max-w-[140px] h-10 text-base"
              )}
            >
              Saved
            </Button>
          </div>
        </div>

        {/* Thread list */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto px-2 pb-safe">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-eclipse-muted">
              {searchQuery ? "No threads match your search" : "No threads to display"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredThreads.map(thread => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onLike={handleToggleLike}
                  onBookmark={handleToggleBookmark}
                  onFollow={handleFollowUser}
                  onBlock={handleBlockUser}
                  onReport={handleReportUser}
                  onOpenThread={handleOpenThread}
                  onShare={handleShareThread}
                  isMobile={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thread detail dialog */}
        {selectedThread && (
          <ThreadDetail 
            thread={selectedThread}
            onLike={handleToggleLike}
            onBookmark={handleToggleBookmark}
            onFollow={handleFollowUser}
            onBlock={handleBlockUser}
            onReport={handleReportUser}
            onShare={handleShareThread}
            open={threadDetailOpen}
            onClose={() => setThreadDetailOpen(false)}
          />
        )}

        {/* Report Dialog */}
        <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Report User</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for reporting this user. Your report will be reviewed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting"
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitReport}>Submit Report</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop view (3-column layout)
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left column - Profile & stats */}
      <div className="w-64 border-r border-eclipse-border bg-eclipse-card p-4 flex flex-col overflow-y-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={userProfile?.photoURL || ''} />
            <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary text-xl">
              {userProfile?.displayName?.substring(0, 2).toUpperCase() || 'EU'}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-medium text-lg">{userProfile?.displayName || 'Eclipse User'}</h2>
          <p className="text-sm text-eclipse-muted mb-1">@{userProfile?.username || 'eclipseuser'}</p>
          <Button variant="outline" size="sm" className="mt-2">
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-eclipse-background p-3 rounded-md text-center">
            <p className="text-lg font-medium">{userProfile?.threadCount || 0}</p>
            <p className="text-xs text-eclipse-muted">Threads</p>
          </div>
          <div className="bg-eclipse-background p-3 rounded-md text-center">
            <p className="text-lg font-medium">{userProfile?.followers?.length || 0}</p>
            <p className="text-xs text-eclipse-muted">Followers</p>
          </div>
          <div className="bg-eclipse-background p-3 rounded-md text-center">
            <p className="text-lg font-medium">{userProfile?.following?.length || 0}</p>
            <p className="text-xs text-eclipse-muted">Following</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Bookmarks</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-eclipse-primary"
              onClick={() => setActiveTab("bookmarks")}
            >
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {threads.filter((t) => t.isBookmarked).slice(0, 3).map(thread => (
              <div 
                key={thread.id} 
                className="bg-eclipse-background p-2 rounded-md text-sm cursor-pointer hover:bg-eclipse-background/70"
                onClick={() => handleOpenThread(thread.id)}
              >
                <p className="line-clamp-2">{thread.content}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-eclipse-muted">{thread.authorName}</span>
                  <span className="text-xs text-eclipse-muted">
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {threads.filter((t) => t.isBookmarked).length === 0 && (
              <div className="text-center py-2 text-eclipse-muted text-sm">
                No bookmarks yet
              </div>
            )}
          </div>
        </div>

        {/* User's Recent Activity */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">My Recent Threads</h3>
          <div className="space-y-2">
            {threads.filter((t) => auth.currentUser && t.authorId === auth.currentUser.uid).slice(0, 3).map(thread => (
              <div 
                key={thread.id} 
                className="bg-eclipse-background p-2 rounded-md text-sm cursor-pointer hover:bg-eclipse-background/70"
                onClick={() => handleOpenThread(thread.id)}
              >
                <p className="line-clamp-2">{thread.content}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <div className="flex items-center gap-1 text-xs text-eclipse-muted">
                    <span>{thread.likeCount} likes</span>
                    <span>•</span>
                    <span>{thread.commentCount} comments</span>
                  </div>
                </div>
              </div>
            ))}
            {threads.filter((t) => auth.currentUser && t.authorId === auth.currentUser.uid).length === 0 && (
              <div className="text-center py-2 text-eclipse-muted text-sm">
                No threads yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle column - Thread list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-eclipse-border flex justify-between items-center sticky top-0 z-10 bg-eclipse-card">
          <div className="flex items-center">
            <Hash size={20} className="text-eclipse-primary mr-2" />
            <h1 className="text-xl font-medium">Threads</h1>
          </div>
        </div>

        {/* Thread composer */}
        <ThreadComposer 
          onSubmit={handleCreateThread} 
          isSubmitting={isSubmitting}
        />

        <div className="p-4 border-b border-eclipse-border">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-eclipse-muted" />
            <Input 
              placeholder="Search threads" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-eclipse-background border-eclipse-border" 
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={activeTab === "threads" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("threads")}
              className={activeTab === "threads" ? "bg-eclipse-primary" : ""}
            >
              All Threads
            </Button>
            <Button 
              variant={activeTab === "bookmarks" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("bookmarks")}
              className={activeTab === "bookmarks" ? "bg-eclipse-primary" : ""}
            >
              Bookmarked
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          <div className="pb-4">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-eclipse-muted">
                {searchQuery ? "No threads match your search" : "No threads to display"}
              </div>
            ) : (
              filteredThreads.map(thread => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onLike={handleToggleLike}
                  onBookmark={handleToggleBookmark}
                  onFollow={handleFollowUser}
                  onBlock={handleBlockUser}
                  onReport={handleReportUser}
                  onOpenThread={handleOpenThread}
                  onShare={handleShareThread}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right column - Trending & suggestions */}
      <div className="w-72 border-l border-eclipse-border bg-eclipse-card p-4">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <TrendingUp size={18} className="text-eclipse-primary mr-2" />
            <h2 className="font-medium">Trending Tags</h2>
          </div>
          <div className="space-y-2">
            {trendingTags.map(tag => (
              <div 
                key={tag.name} 
                className="flex justify-between items-center hover:bg-eclipse-background p-2 rounded-md cursor-pointer"
                onClick={() => setSearchQuery(tag.name)}
              >
                <span className="text-sm">#{tag.name}</span>
                <span className="text-xs text-eclipse-muted">{tag.threadCount}</span>
              </div>
            ))}
            {trendingTags.length === 0 && (
              <div className="text-center py-2 text-eclipse-muted text-sm">
                No trending tags yet
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h2 className="font-medium mb-4">Suggested to Follow</h2>
          <div className="space-y-3">
            {suggestedUsers.map(user => (
              <div key={user.id} className="flex items-start">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-sm">{user.displayName}</p>
                      {user.verified && (
                        <span className="text-eclipse-primary">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => handleFollowUser(user.id)}
                    >
                      Follow
                    </Button>
                  </div>
                  <p className="text-xs text-eclipse-muted">@{user.username}</p>
                  <p className="text-xs mt-1 line-clamp-2">{user.bio}</p>
                </div>
              </div>
            ))}
            {suggestedUsers.length === 0 && (
              <div className="text-center py-2 text-eclipse-muted text-sm">
                No suggestions available
              </div>
            )}
          </div>
        </div>

        {/* My Followers Section */}
        {userProfile?.followers && userProfile.followers.length > 0 && (
          <div className="mt-6">
            <h2 className="font-medium mb-4">My Followers</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {userProfile.followers.slice(0, 5).map((followerId, index) => (
                <div 
                  key={followerId} 
                  className="flex items-center p-2 hover:bg-eclipse-background rounded-md cursor-pointer"
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "User profile view is coming soon"
                  })}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                      {index + 1}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm">Follower {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thread detail dialog */}
      {selectedThread && (
        <ThreadDetail 
          thread={selectedThread}
          onLike={handleToggleLike}
          onBookmark={handleToggleBookmark}
          onFollow={handleFollowUser}
          onBlock={handleBlockUser}
          onReport={handleReportUser}
          onShare={handleShareThread}
          open={threadDetailOpen}
          onClose={() => setThreadDetailOpen(false)}
        />
      )}

      {/* Report Dialog */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report User</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for reporting this user. Your report will be reviewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for reporting"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitReport}>Submit Report</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
