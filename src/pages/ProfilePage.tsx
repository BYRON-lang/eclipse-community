
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  User,
  Camera,
  Edit,
  Settings,
  Shield,
  Bell,
  Key,
  MessageSquare,
  Lock,
  UserPlus,
} from "lucide-react";

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "eclipseuser",
    displayName: "Eclipse User",
    bio: "Privacy enthusiast and tech lover. End-to-end encryption advocate.",
    location: "Digital World",
    website: "https://example.com",
    avatar: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSaveProfile = () => {
    setIsEditing(false);
    // In a real app, you'd save the profile data here
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload the file and get a URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          avatar: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="min-h-full bg-eclipse-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <p className="text-eclipse-muted">Manage your account and preferences</p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full bg-eclipse-card border-eclipse-border">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} />
              <span className="hidden md:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden md:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key size={16} />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <UserPlus size={16} />
              <span className="hidden md:inline">Connections</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-eclipse-card border-eclipse-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="border-eclipse-border"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar section */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileData.avatar || undefined} />
                        <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary text-2xl">
                          {profileData.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing && (
                        <label 
                          htmlFor="avatar-upload" 
                          className="absolute bottom-0 right-0 h-8 w-8 bg-eclipse-primary rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <Camera size={16} className="text-white" />
                          <input 
                            id="avatar-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                    
                    <Badge className="mt-3 bg-eclipse-primary">Ghost Mode Active</Badge>
                  </div>
                  
                  {/* Profile fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                          disabled={!isEditing}
                          className="bg-eclipse-background border-eclipse-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          disabled={!isEditing}
                          className="bg-eclipse-background border-eclipse-border"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!isEditing}
                        rows={3}
                        className="bg-eclipse-background border-eclipse-border resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          disabled={!isEditing}
                          className="bg-eclipse-background border-eclipse-border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                          disabled={!isEditing}
                          className="bg-eclipse-background border-eclipse-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {isEditing && (
                <CardFooter className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-eclipse-border"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-eclipse-primary hover:bg-eclipse-primary/90"
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card className="bg-eclipse-card border-eclipse-border">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy options</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ghost Mode</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ghost-mode">Enable Ghost Mode</Label>
                      <p className="text-sm text-eclipse-muted">Messages disappear after being read</p>
                    </div>
                    <Switch id="ghost-mode" defaultChecked />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ghost-timeout">Message Vanish Time</Label>
                    <select 
                      id="ghost-timeout"
                      className="w-full rounded-md border border-eclipse-border bg-eclipse-background px-3 py-2 text-eclipse-text"
                    >
                      <option value="30">30 seconds after read</option>
                      <option value="60">1 minute after read</option>
                      <option value="300" selected>5 minutes after read</option>
                      <option value="600">10 minutes after read</option>
                    </select>
                  </div>
                </div>
                
                <Separator className="bg-eclipse-border" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Last Seen & Status</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="online-status">Show online status</Label>
                      <p className="text-sm text-eclipse-muted">Let others see when you're online</p>
                    </div>
                    <Switch id="online-status" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="read-receipts">Read receipts</Label>
                      <p className="text-sm text-eclipse-muted">Let others know when you've read their messages</p>
                    </div>
                    <Switch id="read-receipts" defaultChecked />
                  </div>
                </div>
                
                <Separator className="bg-eclipse-border" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Privacy</h3>
                  
                  <div>
                    <Label htmlFor="profile-visibility">Who can see my profile</Label>
                    <select 
                      id="profile-visibility"
                      className="mt-2 w-full rounded-md border border-eclipse-border bg-eclipse-background px-3 py-2 text-eclipse-text"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts" selected>Contacts only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Placeholder for other tabs */}
          <TabsContent value="notifications">
            <Card className="bg-eclipse-card border-eclipse-border">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Notification settings will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="bg-eclipse-card border-eclipse-border">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Security settings will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections">
            <Card className="bg-eclipse-card border-eclipse-border">
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
                <CardDescription>Manage your connections</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Connection settings will be implemented soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
