
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useSettings } from "@/contexts/settings-context";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Volume2,
  Clock,
  Lock,
  Shield,
  LogOut,
  Trash2,
  InfoIcon,
  ExternalLink
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-full bg-eclipse-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-eclipse-muted">Configure your Eclipse Chat experience</p>
        </div>
        
        {/* Appearance Settings */}
        <Card className="bg-eclipse-card border-eclipse-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor size={18} />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize your application theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-2 border-eclipse-primary bg-eclipse-background hover:bg-eclipse-background"
                >
                  <Moon size={24} className="text-eclipse-primary" />
                  <span>Dark</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-2 border-eclipse-border bg-eclipse-card hover:bg-eclipse-card"
                >
                  <Sun size={24} />
                  <span>Light</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-2 border-eclipse-border bg-eclipse-card hover:bg-eclipse-card"
                >
                  <Monitor size={24} />
                  <span>System</span>
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-eclipse-muted">Use less space between items</p>
                </div>
                <Switch id="compact-view" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animate-transitions">Animate Transitions</Label>
                  <p className="text-sm text-eclipse-muted">Enable animations in the interface</p>
                </div>
                <Switch id="animate-transitions" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications Settings */}
        <Card className="bg-eclipse-card border-eclipse-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Control how you are notified</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>
        
        {/* Privacy & Security Settings */}
        <Card className="bg-eclipse-card border-eclipse-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>Control your privacy and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Ghost Mode</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="default-ghost-mode">Enable Ghost Mode by Default</Label>
                  <p className="text-sm text-eclipse-muted">New chats will start in Ghost Mode</p>
                </div>
                <Switch id="default-ghost-mode" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-timeout">Default Ghost Message Timeout</Label>
                <select 
                  id="default-timeout"
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
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Security</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-eclipse-muted">Require code when signing in</p>
                </div>
                <Switch id="two-factor" />
              </div>
              
              <Button variant="outline" className="w-full border-eclipse-border">
                <Lock size={16} className="mr-2" />
                Change Password
              </Button>
            </div>
            
            <Separator className="bg-eclipse-border" />
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Data & Storage</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-download">Auto-Download Media</Label>
                  <p className="text-sm text-eclipse-muted">Automatically download images and videos</p>
                </div>
                <Switch id="auto-download" defaultChecked />
              </div>
              
              <Button variant="outline" className="w-full border-eclipse-border">
                <Trash2 size={16} className="mr-2" />
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Actions */}
        <Card className="bg-eclipse-card border-eclipse-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full border-eclipse-border">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
            
            <Button variant="outline" className="w-full border-eclipse-danger text-eclipse-danger hover:bg-eclipse-danger/10">
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
        
        {/* About */}
        <Card className="bg-eclipse-card border-eclipse-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <InfoIcon size={18} />
              <CardTitle>About</CardTitle>
            </div>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm">Eclipse Chat v1.0.0</p>
              <p className="text-sm text-eclipse-muted mt-1">Privacy-First Messaging Platform</p>
            </div>
            
            <div className="flex items-center justify-between">
              <Button variant="link" className="p-0 text-eclipse-primary">
                Privacy Policy
                <ExternalLink size={14} className="ml-1" />
              </Button>
              
              <Button variant="link" className="p-0 text-eclipse-primary">
                Terms of Service
                <ExternalLink size={14} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
