
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Mail, Lock, User, AtSign } from "lucide-react";
import { useAuth } from "@/contexts/firebase-auth-context";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated?: () => void;
};

export function AuthModal({ open, onOpenChange, onAuthenticated }: AuthModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  
  const { signIn, signUp, signInWithGoogle, authError } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let success = false;
      
      if (activeTab === "login") {
        const user = await signIn(email, password);
        success = !!user;
      } else {
        const user = await signUp(email, password);
        success = !!user;
      }
      
      if (success) {
        if (onAuthenticated) {
          onAuthenticated();
        }
        
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    setLoading(true);
    
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (onAuthenticated) {
          onAuthenticated();
        }
        
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-eclipse-card border-eclipse-border">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock size={24} className="text-eclipse-primary mr-2" />
            <h2 className="text-2xl font-medium">Eclipse Chat</h2>
          </div>
          <p className="text-eclipse-muted text-sm">
            Join the conversation with privacy in mind
          </p>
        </div>

        {authError && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4 text-sm">
            {authError}
          </div>
        )}

        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as "login" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-eclipse-background">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-eclipse-primary hover:bg-eclipse-primary/90" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-eclipse-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-eclipse-card px-2 text-eclipse-muted">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  className="bg-transparent border-eclipse-border text-eclipse-text hover:bg-eclipse-background"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  Google
                </Button>
                <Button 
                  variant="outline"
                  type="button"
                  className="bg-transparent border-eclipse-border text-eclipse-text hover:bg-eclipse-background"
                  disabled={loading}
                >
                  Apple
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    placeholder="Full Name" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <AtSign className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    placeholder="Username" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    className="pl-8 bg-eclipse-background border-eclipse-border" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-eclipse-primary hover:bg-eclipse-primary/90" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-eclipse-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-eclipse-card px-2 text-eclipse-muted">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  className="bg-transparent border-eclipse-border text-eclipse-text hover:bg-eclipse-background"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  Google
                </Button>
                <Button 
                  variant="outline"
                  type="button"
                  className="bg-transparent border-eclipse-border text-eclipse-text hover:bg-eclipse-background"
                  disabled={loading}
                >
                  Apple
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
