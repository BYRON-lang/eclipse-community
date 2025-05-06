
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, User, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getUserEncryptionKeys } from "@/services/chat-service";
import { generateKeyPair, exportPublicKey } from "@/utils/encryption";
import { createChat } from "@/services/chat-service";

interface SearchResult {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  email?: string;
}

export default function NewChatButton() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);

    try {
      const usersRef = collection(db, "users");

      // Search by displayName, username, or email
      const displayNameQuery = query(
        usersRef,
        where("displayName", ">=", searchQuery),
        where("displayName", "<=", searchQuery + "\uf8ff")
      );

      const usernameQuery = query(
        usersRef,
        where("username", ">=", searchQuery),
        where("username", "<=", searchQuery + "\uf8ff")
      );

      const emailQuery = query(
        usersRef,
        where("email", ">=", searchQuery),
        where("email", "<=", searchQuery + "\uf8ff")
      );

      const [displayNameSnapshot, usernameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(usernameQuery),
        getDocs(emailQuery)
      ]);

      // Combine and deduplicate results
      const combinedResults: Record<string, SearchResult> = {};

      [...displayNameSnapshot.docs, ...usernameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        const data = doc.data();
        
        // Skip current user
        if (auth.currentUser?.uid === doc.id) return;
        
        // Avoid duplicates by using userId as key
        if (!combinedResults[doc.id]) {
          combinedResults[doc.id] = {
            id: doc.id,
            displayName: data.displayName || "User",
            username: data.username,
            photoURL: data.photoURL,
            email: data.email
          };
        }
      });

      setResults(Object.values(combinedResults));
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const startNewChat = async (userId: string) => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start a chat",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure current user exists and has required data
      if (!auth.currentUser?.uid) {
        throw new Error("User not authenticated");
      }

      // Get or generate current user's encryption keys
      const { publicKey: currentUserPublicKey } = await getUserEncryptionKeys();

      // Get target user's data including publicKey
      const targetUserDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
      if (targetUserDoc.empty) {
        throw new Error("User not found");
      }
      const targetUserData = targetUserDoc.docs[0].data() || {};

      // If target user doesn't have keys, generate them
      if (!targetUserData?.publicKey) {
        // Update target user's document with encryption keys
        const keyPair = await generateKeyPair();
        const publicKey = await exportPublicKey(keyPair.publicKey);
        await updateDoc(doc(db, "users", userId), {
          publicKey,
          keysGenerated: serverTimestamp()
        });
        targetUserData.publicKey = publicKey;
      }

      const chatId = await createChat([userId], true);
      toast({
        title: "Chat created",
        description: "Your new chat has been created",
      });
      setOpen(false);
      
      // Navigate to the new chat
      window.location.href = `/chats?id=${chatId}`;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-eclipse-text">
          <Plus size={22} />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md"
        aria-label="New Chat Dialog"
        aria-describedby="dialog-description"
      >
        <div id="dialog-description" className="sr-only">
          Search and start new chats with other users
        </div>
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
            <Input
              placeholder="Search for people"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </div>

        <ScrollArea className="h-72 mt-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-eclipse-background/50 rounded-md"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                        {user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-eclipse-muted">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="ml-2"
                    onClick={() => startNewChat(user.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-eclipse-muted">
              <User size={48} className="mb-4 opacity-50" />
              <p>Search for users to start a chat</p>
              {searchQuery.length > 0 && !searching && (
                <p className="text-sm mt-2">No users found matching "{searchQuery}"</p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
