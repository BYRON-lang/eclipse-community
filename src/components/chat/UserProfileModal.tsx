
import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle, Users } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joined?: string;
  isOnline?: boolean;
  ghostModeEnabled?: boolean;
  mutualContacts?: number;
}

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onStartChat?: (userId: string) => Promise<void>;
}

export function UserProfileModal({ open, onOpenChange, user, onStartChat }: UserProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-eclipse-card border-eclipse-border">
        <DialogHeader className="text-center">
          <div className="flex flex-col items-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary text-xl">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-medium">{user.name}</h2>
              {user.isOnline && (
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
              )}
            </div>
            
            <p className="text-sm text-eclipse-muted">@{user.username}</p>
            
            {user.ghostModeEnabled && (
              <div className="flex items-center mt-2 text-xs text-eclipse-primary">
                <Clock size={12} className="mr-1" />
                <span>Ghost Mode Enabled</span>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {user.bio && (
            <p className="text-sm text-center px-4">{user.bio}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <Button 
              variant="outline" 
              className="bg-eclipse-background border-eclipse-border hover:bg-eclipse-card"
              onClick={() => onStartChat && onStartChat(user.id)}
            >
              <MessageCircle size={16} className="mr-2" />
              Message
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-eclipse-background border-eclipse-border hover:bg-eclipse-card"
            >
              <Users size={16} className="mr-2" />
              {user.mutualContacts} Mutual
            </Button>
          </div>
          
          <Separator className="bg-eclipse-border" />
          
          <div className="space-y-2 px-1">
            {user.location && (
              <div className="flex justify-between text-sm">
                <span className="text-eclipse-muted">Location</span>
                <span>{user.location}</span>
              </div>
            )}
            
            {user.joined && (
              <div className="flex justify-between text-sm">
                <span className="text-eclipse-muted">Joined</span>
                <span>{user.joined}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-eclipse-muted">Status</span>
              <span>{user.isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
          
          <Separator className="bg-eclipse-border" />
          
          <div className="flex justify-center space-x-2">
            <Badge variant="secondary" className="bg-eclipse-background hover:bg-eclipse-card">
              Privacy
            </Badge>
            <Badge variant="secondary" className="bg-eclipse-background hover:bg-eclipse-card">
              Security
            </Badge>
            <Badge variant="secondary" className="bg-eclipse-background hover:bg-eclipse-card">
              Tech
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
