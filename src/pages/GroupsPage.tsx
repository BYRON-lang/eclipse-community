
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, MessageSquare, Plus, User, Clock, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Group, getGroupsForUser, joinGroup, leaveGroup, archiveGroup, unarchiveGroup } from "@/services/group-service";
import { auth } from "@/lib/firebase";
import { optimizeImage } from "@/utils/image-optimization";
import { formatThreadContent } from "@/utils/thread-helpers";
import { CreateGroupModal } from "@/components/group/CreateGroupModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { encryptMessage } from "@/utils/encryption";

interface GroupWithUI extends Group {
  isJoining?: boolean;
  isLeaving?: boolean;
}

export default function GroupsPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<GroupWithUI[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    const unsubscribe = getGroupsForUser((updatedGroups) => {
      setGroups(updatedGroups.map(group => ({
        ...group,
        isJoining: false,
        isLeaving: false
      })));
    });
    
    return () => unsubscribe();
  }, []);

  // Groups data is now handled through Firebase subscription
  // See useEffect above for the data fetching logic
  
  // Filter groups based on search query and active tab
  const filteredGroups = groups.filter(group => 
    (activeTab === "active" ? !group.isArchived : group.isArchived) &&
    (searchQuery === "" || 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const toggleAnonymousMode = () => {
    setAnonymousMode(!anonymousMode);
  };

  const handleJoinGroup = async (id: string) => {
    try {
      setGroups(groups.map(group =>
        group.id === id ? { ...group, isJoining: true } : group
      ));
      
      await joinGroup(id);
      toast({
        title: "Joined group",
        description: "You have successfully joined the group."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join group.",
        variant: "destructive"
      });
    } finally {
      setGroups(groups.map(group =>
        group.id === id ? { ...group, isJoining: false } : group
      ));
    }
  };
  
  const handleLeaveGroup = async (id: string) => {
    try {
      setGroups(groups.map(group =>
        group.id === id ? { ...group, isLeaving: true } : group
      ));
      
      await leaveGroup(id);
      toast({
        title: "Left group",
        description: "You have successfully left the group."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave group.",
        variant: "destructive"
      });
    } finally {
      setGroups(groups.map(group =>
        group.id === id ? { ...group, isLeaving: false } : group
      ));
    }
  };
  
  const handleArchiveGroup = async (id: string) => {
    try {
      setIsLoading(true);
      await archiveGroup(id);
      toast({
        title: "Group archived",
        description: "The group has been moved to archives."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive group.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUnarchiveGroup = async (id: string) => {
    try {
      setIsLoading(true);
      await unarchiveGroup(id);
      toast({
        title: "Group restored",
        description: "The group has been restored from archives."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore group.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-eclipse-background">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-eclipse-border bg-eclipse-card">
        <div className="flex items-center">
          <Users size={20} className="text-eclipse-primary mr-2" />
          <h1 className="text-lg font-medium">Groups</h1>
        </div>
        <Button 
          className="bg-eclipse-primary hover:bg-eclipse-primary/90"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} className="mr-2" />
          Create Group
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-eclipse-muted" />
            <Input 
              placeholder="Search groups" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-eclipse-card border-eclipse-border" 
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="anonymous-mode"
                checked={anonymousMode}
                onCheckedChange={toggleAnonymousMode}
              />
              <div className="flex items-center">
                <Label htmlFor="anonymous-mode" className="text-sm cursor-pointer">
                  <Clock size={14} className="inline-block mr-1 text-eclipse-primary" />
                  Anonymous Mode
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="bg-eclipse-card border-eclipse-border">
            <TabsTrigger value="active" className="flex-1">Active Groups</TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
          </TabsList>
          
          {/* Groups List */}
          <TabsContent value={activeTab} className="mt-0 flex-1 overflow-y-auto mt-4">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-eclipse-muted">
                {searchQuery ? "No groups match your search" : `No ${activeTab} groups`}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.map(group => (
                  <div 
                    key={group.id}
                    className="bg-eclipse-card border border-eclipse-border rounded-lg p-3 hover:border-eclipse-primary transition-colors"
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={optimizeImage(group.avatar, 48)} />
                        <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                          {group.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{group.name}</h3>
                            {group.isAnonymous && (
                              <Badge
                                variant="outline"
                                className="border-eclipse-primary/50 bg-eclipse-primary/10 text-eclipse-primary text-xs"
                              >
                                <User size={12} className="mr-1" />
                                Anonymous
                              </Badge>
                            )}
                            {group.isPrivate && (
                              <Badge
                                variant="outline"
                                className="border-eclipse-muted/50 bg-eclipse-muted/10 text-eclipse-muted text-xs"
                              >
                                <Shield size={12} className="mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                          {group.lastMessageTime && (
                            <div className="text-xs text-eclipse-muted">
                              {new Date(group.lastMessageTime).toLocaleDateString(undefined, { 
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                        
                        {group.lastMessage && (
                          <div className="text-sm text-eclipse-muted line-clamp-2 mt-1">
                            {formatThreadContent(group.lastMessage, 150)}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-eclipse-muted">
                            <Users size={12} className="mr-1" />
                            <span>{group.memberCount.toLocaleString()} members</span>
                          </div>
                          
                          <div className="flex gap-2">
                            {group.members.includes(auth.currentUser?.uid || '') ? (
                              <>
                                {activeTab === "active" ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs text-eclipse-muted hover:text-eclipse-text"
                                      onClick={() => handleArchiveGroup(group.id)}
                                      disabled={isLoading}
                                    >
                                      Archive
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs border-eclipse-border"
                                      onClick={() => navigate(`/group/${group.id}`)}
                                    >
                                      <MessageSquare size={12} className="mr-1" />
                                      Open
                                      {group.unreadCount && group.unreadCount > 0 && (
                                        <span className="ml-1.5 bg-eclipse-primary text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                                          {group.unreadCount}
                                        </span>
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-eclipse-border"
                                    onClick={() => handleUnarchiveGroup(group.id)}
                                    disabled={isLoading}
                                  >
                                    Unarchive
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-eclipse-danger hover:text-eclipse-danger/80"
                                  onClick={() => handleLeaveGroup(group.id)}
                                  disabled={isLoading || group.isLeaving}
                                >
                                  {group.isLeaving ? 'Leaving...' : 'Leave'}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs bg-eclipse-primary text-white hover:bg-eclipse-primary/90 border-eclipse-primary"
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={isLoading || group.isJoining}
                              >
                                {group.isJoining ? 'Joining...' : (group.isPrivate ? 'Request to Join' : 'Join Group')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Anonymous mode banner */}
      {anonymousMode && (
        <div className="p-3 bg-eclipse-primary/10 border-t border-eclipse-primary/20 text-center">
          <p className="text-sm flex items-center justify-center">
            <Shield size={14} className="text-eclipse-primary mr-1.5" />
            <span>Anonymous Mode is active. Your identity will be hidden in groups.</span>
          </p>
        </div>
      )}
      
      {/* Create Group Modal */}
      <CreateGroupModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onGroupCreated={(groupId) => {
          toast({
            title: "Group Created",
            description: "Your new group has been created successfully."
          });
          navigate(`/group/${groupId}`);
        }}
      />
      
      {/* Mobile floating action button */}
      {isMobile && (
        <Button 
          size="icon" 
          className="fixed right-6 bottom-6 h-12 w-12 rounded-full shadow-lg bg-eclipse-primary hover:bg-eclipse-primary/90"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
}
