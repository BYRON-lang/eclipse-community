import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Shield, Send, Paperclip } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { auth, db } from "@/lib/firebase";
import { optimizeImage } from "@/utils/image-optimization";
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, DocumentData } from 'firebase/firestore';
import { encryptMessage, decryptMessage } from '@/utils/encryption';

interface Group extends DocumentData {
  id: string;
  name: string;
  members: string[];
  isPrivate: boolean;
  isAnonymous: boolean;
  encryptionKey?: string;
  createdAt: Date;
  lastMessageTime?: Date;
}

interface GroupMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  encrypted?: boolean;
  iv?: string;
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Load group data
  useEffect(() => {
    if (!groupId || !auth.currentUser) {
      navigate('/groups');
      return;
    }
    
    const fetchGroup = async () => {
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupDoc = await getDoc(groupRef);
        
        if (!groupDoc.exists()) {
          toast({
            title: "Error",
            description: "Group not found",
            variant: "destructive"
          });
          navigate('/groups');
          return;
        }
        
        const groupData = groupDoc.data();
        
        // Check if user is a member
        if (!groupData.members.includes(auth.currentUser?.uid)) {
          toast({
            title: "Access Denied",
            description: "You are not a member of this group",
            variant: "destructive"
          });
          navigate('/groups');
          return;
        }
        
        setGroup({
          id: groupDoc.id,
          ...groupData,
          createdAt: groupData.createdAt?.toDate(),
          lastMessageTime: groupData.lastMessageTime?.toDate()
        });
        
        // Subscribe to messages
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        return onSnapshot(q, async (snapshot) => {
          const messagePromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            let messageContent = data.content;
            
            // Decrypt message if it's encrypted
            if (data.encrypted && data.iv) {
              try {
                messageContent = await decryptMessage(data.content, data.iv);
              } catch (error) {
                console.error("Failed to decrypt message:", error);
                messageContent = "[Encrypted message]";
              }
            }
            
            return {
              id: doc.id,
              content: messageContent,
              senderId: data.senderId,
              senderName: data.senderName || 'Unknown',
              timestamp: data.timestamp?.toDate() || new Date(),
              encrypted: data.encrypted || false,
              iv: data.iv
            };
          });
          
          const decryptedMessages = await Promise.all(messagePromises);
          setMessages(decryptedMessages);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error loading group:", error);
        toast({
          title: "Error",
          description: "Failed to load group data",
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    let unsubscribe: (() => void) | undefined;
    fetchGroup().then(unsub => {
      unsubscribe = unsub;
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [groupId, navigate, toast]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !group || !auth.currentUser) return;
    
    try {
      setSending(true);
      
      let messageContent = newMessage;
      let iv = null;
      
      // Encrypt message if the group is private
      if (group.isPrivate) {
        const encryptionResult = await encryptMessage(newMessage, group.encryptionKey);
        messageContent = encryptionResult.ciphertext;
        iv = encryptionResult.iv;
      }
      
      // Add message to Firestore
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      await addDoc(messagesRef, {
        content: messageContent,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'User',
        timestamp: serverTimestamp(),
        encrypted: group.isPrivate,
        iv: iv,
        isAnonymous: group.isAnonymous
      });
      
      // Update group's last message
      await updateDoc(doc(db, 'groups', groupId), {
        lastMessage: messageContent,
        lastMessageTime: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eclipse-primary"></div>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-medium mb-2">Group not found</h2>
        <Button onClick={() => navigate('/groups')}>Back to Groups</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-eclipse-background">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-eclipse-border bg-eclipse-card">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft size={20} />
          </Button>
          
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={optimizeImage(group.avatar, 40)} />
            <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">{group.name}</h2>
              {group.isAnonymous && (
                <Badge
                  variant="outline"
                  className="border-eclipse-primary/50 bg-eclipse-primary/10 text-eclipse-primary text-xs"
                >
                  Anonymous
                </Badge>
              )}
              {group.isPrivate && (
                <Badge
                  variant="outline"
                  className="border-eclipse-muted/50 bg-eclipse-muted/10 text-eclipse-muted text-xs"
                >
                  <Shield size={12} className="mr-1" />
                  Encrypted
                </Badge>
              )}
            </div>
            <div className="flex items-center text-xs text-eclipse-muted">
              <Users size={12} className="mr-1" />
              <span>{group.memberCount} members</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-eclipse-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === auth.currentUser?.uid;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser 
                    ? 'bg-eclipse-primary text-white' 
                    : 'bg-eclipse-card border border-eclipse-border'}`}
                >
                  {!isCurrentUser && group.isAnonymous ? (
                    <div className="text-xs text-eclipse-muted mb-1">Anonymous</div>
                  ) : !isCurrentUser ? (
                    <div className="text-xs text-eclipse-muted mb-1">{message.senderName}</div>
                  ) : null}
                  
                  <div className="break-words">{message.content}</div>
                  
                  <div className="text-xs mt-1 text-right opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.encrypted && (
                      <Shield size={10} className="inline-block ml-1" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Message input */}
      <div className="p-3 border-t border-eclipse-border bg-eclipse-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-eclipse-muted hover:text-eclipse-text"
          >
            <Paperclip size={20} />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${group.name}...`}
            className="flex-1 bg-eclipse-background border-eclipse-border"
          />
          
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-eclipse-primary hover:bg-eclipse-primary/90"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}