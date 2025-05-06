
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Clock, Upload, User } from "lucide-react";

interface ProfileSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ProfileSetupModal({ open, onOpenChange, onComplete }: ProfileSetupModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);

  // Form states
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 1500);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!loading) onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md bg-eclipse-card border-eclipse-border">
        <div className="text-center mb-4">
          <h2 className="text-xl font-medium">Complete Your Profile</h2>
          <p className="text-eclipse-muted text-sm">Step {step} of {totalSteps}</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Basic Info</h3>
              <p className="text-eclipse-muted text-sm">How would you like to be known?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  placeholder="Your display name" 
                  className="bg-eclipse-background border-eclipse-border"
                  defaultValue="Eclipse User" 
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="@username" 
                  className="bg-eclipse-background border-eclipse-border"
                  defaultValue="eclipse_user" 
                />
                <p className="text-xs text-eclipse-muted mt-1">This will be your unique identifier</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Profile Picture</h3>
              <p className="text-eclipse-muted text-sm">Add a photo to personalize your profile</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border-2 border-eclipse-border">
                <AvatarImage src={avatar || ""} />
                <AvatarFallback className="bg-eclipse-background text-eclipse-primary">
                  <User size={32} />
                </AvatarFallback>
              </Avatar>

              <div className="relative">
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                />
                <Button 
                  variant="outline" 
                  className="bg-eclipse-background border-eclipse-border text-eclipse-text"
                  onClick={() => document.getElementById("avatar")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Choose Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Privacy Settings</h3>
              <p className="text-eclipse-muted text-sm">Control your default privacy options</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ghost-mode">Ghost Mode Default</Label>
                  <p className="text-xs text-eclipse-muted">Messages disappear after being read</p>
                </div>
                <Switch id="ghost-mode" className="data-[state=checked]:bg-eclipse-primary" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous">Anonymous Mode Default</Label>
                  <p className="text-xs text-eclipse-muted">Stay anonymous in groups by default</p>
                </div>
                <Switch id="anonymous" className="data-[state=checked]:bg-eclipse-primary" />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Write a short bio about yourself" 
                  className="bg-eclipse-background border-eclipse-border h-24"
                  defaultValue="Eclipse Chat user" 
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="bg-eclipse-background border-eclipse-border text-eclipse-text">
              Back
            </Button>
          ) : (
            <div></div>
          )}

          <Button onClick={handleNext} className="bg-eclipse-primary hover:bg-eclipse-primary/90" disabled={loading}>
            {loading ? (
              "Finishing..."
            ) : step === totalSteps ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Finish
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
