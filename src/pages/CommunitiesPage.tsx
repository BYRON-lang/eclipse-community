
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Search, Users, MessageSquare, Calendar, Shield, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Community, getCommunitiesForUser, joinCommunity, leaveCommunity, createCommunity } from "@/services/community-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export default function CommunitiesPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // New community form state
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    topics: "",
    isPrivate: false,
    avatar: null as File | null,
    coverImage: null as File | null
  });
  
  useEffect(() => {
    // Subscribe to real-time community updates
    const unsubscribe = getCommunitiesForUser((updatedCommunities) => {
      setCommunities(updatedCommunities);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleJoinCommunity = async (id: string) => {
    try {
      setIsLoading(true);
      const success = await joinCommunity(id);
      if (success) {
        toast({
          title: "Joined community",
          description: "You have successfully joined the community."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLeaveCommunity = async (id: string) => {
    try {
      setIsLoading(true);
      const success = await leaveCommunity(id);
      if (success) {
        toast({
          title: "Left community",
          description: "You have successfully left the community."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave community.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateCommunity = async () => {
    try {
      setIsLoading(true);
      
      if (!newCommunity.name.trim()) {
        throw new Error("Community name is required");
      }
      
      if (!newCommunity.description.trim()) {
        throw new Error("Community description is required");
      }
      
      const topics = newCommunity.topics
        .split(",")
        .map(topic => topic.trim().toLowerCase())
        .filter(topic => topic.length > 0);
      
      await createCommunity(
        newCommunity.name,
        newCommunity.description,
        topics,
        newCommunity.isPrivate,
        newCommunity.avatar,
        newCommunity.coverImage
      );
      
      setIsCreating(false);
      setNewCommunity({
        name: "",
        description: "",
        topics: "",
        isPrivate: false,
        avatar: null,
        coverImage: null
      });
      
      toast({
        title: "Community created",
        description: "Your community has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create community.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter communities based on search query
  const filteredCommunities = communities.filter(community => 
    searchQuery === "" || 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="flex flex-col h-full bg-eclipse-background">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-eclipse-border bg-eclipse-card">
        <div className="flex items-center">
          <Globe size={20} className="text-eclipse-primary mr-2" />
          <h1 className="text-lg font-medium">Communities</h1>
        </div>
        <Button 
          className="bg-eclipse-primary hover:bg-eclipse-primary/90"
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
        >
          <Plus size={16} className="mr-2" />
          Create Community
        </Button>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-eclipse-muted" />
          <Input 
            placeholder="Search communities" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-eclipse-card border-eclipse-border" 
          />
        </div>
      </div>
      
      {/* Community List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-8 text-eclipse-muted">
            {searchQuery ? "No communities match your search" : "No communities to display"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map(community => (
              <div 
                key={community.id}
                className="bg-eclipse-card border border-eclipse-border rounded-lg p-4 hover:border-eclipse-primary transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={community.avatar} />
                    <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                      {community.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="font-medium truncate">{community.name}</h3>
                      {community.isPrivate && (
                        <Shield size={14} className="ml-2 text-eclipse-primary" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-eclipse-muted">
                      <Users size={14} className="mr-1" />
                      <span>{community.memberCount.toLocaleString()} members</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm mb-3 line-clamp-2">{community.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {community.topics.map(topic => (
                    <Badge 
                      key={topic} 
                      variant="outline"
                      className="bg-eclipse-background border-eclipse-border text-xs"
                    >
                      #{topic}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {community.members.includes(auth.currentUser?.uid || '') ? (
                    <>
                      <Button variant="outline" className="flex-1 border-eclipse-border">
                        <MessageSquare size={16} className="mr-2" />
                        Open
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-eclipse-muted border-eclipse-border hover:text-eclipse-danger hover:border-eclipse-danger"
                        onClick={() => handleLeaveCommunity(community.id)}
                        disabled={isLoading}
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full bg-eclipse-primary hover:bg-eclipse-primary/90"
                      onClick={() => handleJoinCommunity(community.id)}
                      disabled={isLoading}
                    >
                      {community.isPrivate ? "Request to Join" : "Join Community"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Community Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Community</DialogTitle>
            <DialogDescription className="text-lg">
              Create a vibrant space for people who share your interests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Community Name</Label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a unique name"
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What's your community about?"
                    className="min-h-[120px] resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topics" className="text-base font-medium">Topics</Label>
                  <Input
                    id="topics"
                    value={newCommunity.topics}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, topics: e.target.value }))}
                    placeholder="Add topics (comma-separated)"
                    className="h-12"
                  />
                  <p className="text-sm text-eclipse-muted">Example: technology, privacy, security</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="text-base font-medium">Community Avatar</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={newCommunity.avatar ? URL.createObjectURL(newCommunity.avatar) : undefined} />
                      <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary text-2xl">
                        {newCommunity.name ? newCommunity.name.substring(0, 2).toUpperCase() : 'CM'}
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewCommunity(prev => ({ 
                        ...prev, 
                        avatar: e.target.files ? e.target.files[0] : null 
                      }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cover" className="text-base font-medium">Cover Image</Label>
                  <div className="relative aspect-video rounded-lg border-2 border-dashed border-eclipse-border bg-eclipse-card/50 hover:bg-eclipse-card/80 transition-colors">
                    {newCommunity.coverImage ? (
                      <img
                        src={URL.createObjectURL(newCommunity.coverImage)}
                        alt="Cover preview"
                        className="absolute inset-0 h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-eclipse-muted">Upload a cover image</p>
                      </div>
                    )}
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewCommunity(prev => ({ 
                        ...prev, 
                        coverImage: e.target.files ? e.target.files[0] : null 
                      }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-eclipse-card/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="private" className="text-base font-medium">Private Community</Label>
                      <p className="text-sm text-eclipse-muted">Only approved members can join</p>
                    </div>
                    <Switch
                      id="private"
                      checked={newCommunity.isPrivate}
                      onCheckedChange={(checked) => setNewCommunity(prev => ({ ...prev, isPrivate: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                className="min-w-[120px]" 
                onClick={handleCreateCommunity}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Community'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile floating action button */}
      {isMobile && (
        <Button 
          className="fixed bottom-4 right-4 rounded-full p-3 bg-eclipse-primary hover:bg-eclipse-primary/90"
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
}
