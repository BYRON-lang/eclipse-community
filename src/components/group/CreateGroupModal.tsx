import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { auth } from '@/lib/firebase';
import { createGroup } from '@/services/group-service';
import { encryptMessage } from '@/utils/encryption';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User, Upload } from "lucide-react";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (groupId: string) => void;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a group",
        variant: "destructive"
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the group using the service function
      const groupId = await createGroup(
        name,
        description,
        isPrivate,
        isAnonymous,
        avatarPreview // Pass the avatar preview URL
      );
      
      toast({
        title: "Success",
        description: "Group created successfully"
      });
      
      // Call the callback with the new group ID
      if (onGroupCreated) {
        onGroupCreated(groupId);
      }
      
      // Close the modal
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
      setIsAnonymous(false);
      setAvatar(null);
      setAvatarPreview('');
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-eclipse-card text-eclipse-text">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription className="text-eclipse-muted">
            Create a new group to chat with multiple people at once.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 mb-2">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : null}
                <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary text-xl">
                  {name ? name.substring(0, 2).toUpperCase() : 'G'}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-eclipse-card border-eclipse-border"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Upload size={12} />
                <span className="sr-only">Upload avatar</span>
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-eclipse-background border-eclipse-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="bg-eclipse-background border-eclipse-border"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <div className="flex items-center">
                <Label htmlFor="private" className="text-sm cursor-pointer">
                  <Shield size={14} className="inline-block mr-1 text-eclipse-primary" />
                  Private Group
                </Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <div className="flex items-center">
                <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                  <User size={14} className="inline-block mr-1 text-eclipse-primary" />
                  Anonymous Mode
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-eclipse-border"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-eclipse-primary hover:bg-eclipse-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}