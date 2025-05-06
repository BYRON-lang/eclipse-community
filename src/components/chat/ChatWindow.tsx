import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Clock, Send, PenSquare, Play, X } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { EmojiPicker } from "./EmojiPicker";
import { AttachmentMenu } from "./AttachmentMenu";
import { UserProfileModal } from "./UserProfileModal";
import { useNotificationSound } from "@/hooks/use-notification-sound";

interface Message {
  id: string;
  content: string;
  sender: "user" | "contact";
  timestamp: string;
  read?: boolean;
  isGhost?: boolean;
  isDisappearing?: boolean;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  attachmentURL?: string;
  attachmentType?: 'image' | 'audio' | 'video' | 'file';
  attachmentName?: string;
}

interface ChatWindowProps {
  contact: {
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
    isTyping?: boolean;
  };
  messages: Message[];
  onSendMessage: (content: string, attachment?: File | Blob) => void;
  onToggleGhostMode: () => void;
  ghostModeActive: boolean;
}

export default function ChatWindow({ contact, messages, onSendMessage, onToggleGhostMode, ghostModeActive }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("");
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [attachment, setAttachment] = useState<File | Blob | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { playSound } = useNotificationSound();

  // Scroll to bottom and play sound when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Play sound for new messages from contacts
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'contact') {
      playSound();
    }
  }, [messages, playSound]);
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (messageInput.trim() || attachment) {
      // Send message with or without attachment
      onSendMessage(messageInput, attachment || undefined);
      setMessageInput("");
      
      // Clean up attachment data
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
      setAttachment(null);
      setAttachmentPreview(null);
    }
  };
  
  const handleFileSelect = (file: File) => {
    setAttachment(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setAttachmentPreview(preview);
    } else {
      setAttachmentPreview(null);
    }
  };
  
  const handleAudioRecorded = (audioBlob: Blob) => {
    setAttachment(audioBlob);
    const preview = URL.createObjectURL(audioBlob);
    setAttachmentPreview(preview);
  };
  
  const cancelAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview(null);
  };
  
  const handleAddReaction = (messageId: string, emoji: string) => {
    console.log(`Added reaction ${emoji} to message ${messageId}`);
    // In a real app, you'd update the message reactions here
  };
  
  const handleRemoveReaction = (messageId: string, emoji: string) => {
    console.log(`Removed reaction ${emoji} from message ${messageId}`);
    // In a real app, you'd update the message reactions here
  };
  
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };
  
  return (
    <div className="flex flex-col h-full bg-eclipse-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-eclipse-border bg-eclipse-card">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setShowUserProfile(true)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                {contact.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {contact.online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-eclipse-card"></span>
            )}
          </div>
          
          <div className="ml-3">
            <p className="font-medium">{contact.name}</p>
            <p className="text-xs text-eclipse-muted">
              {contact.isTyping ? (
                "Typing..."
              ) : (
                contact.online ? "Online" : "Offline"
              )}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleGhostMode}
          className={cn(
            "border-eclipse-border",
            ghostModeActive && "bg-eclipse-primary/10 text-eclipse-primary"
          )}
        >
          <Clock size={16} className="mr-2" />
          {ghostModeActive ? "Ghost Mode On" : "Ghost Mode Off"}
        </Button>
      </div>
      
      {/* Ghost Mode Banner */}
      {ghostModeActive && (
        <div className="bg-eclipse-primary/10 border-b border-eclipse-primary/20 py-2 px-4 text-center">
          <p className="text-xs flex items-center justify-center">
            <Clock size={12} className="text-eclipse-primary mr-1" />
            <span>Ghost Mode enabled: Messages will disappear after being read</span>
          </p>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col",
              message.sender === "user" ? "items-end" : "items-start",
              message.isDisappearing && "animate-fade-out opacity-30"
            )}
          >
            <div className="flex items-end gap-2">
              {message.sender === "contact" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "py-2 px-3 rounded-lg max-w-[70%]",
                  message.sender === "user"
                    ? "bg-eclipse-primary text-white rounded-br-none"
                    : "bg-eclipse-card text-eclipse-text rounded-bl-none"
                )}
              >
                {/* Attachment preview */}
                {message.attachmentURL && message.attachmentType === 'image' && (
                  <div className="mb-2 rounded overflow-hidden">
                    <img 
                      src={message.attachmentURL} 
                      alt="Attachment" 
                      className="max-h-60 w-full object-cover"
                    />
                  </div>
                )}
                
                {message.attachmentURL && message.attachmentType === 'audio' && (
                  <div className="mb-2 bg-eclipse-background p-2 rounded flex items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 mr-2">
                      <Play className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <div className="h-1 bg-eclipse-border rounded overflow-hidden">
                        <div className="h-full bg-eclipse-primary w-0"></div>
                      </div>
                      <p className="text-xs mt-1 text-eclipse-muted">Audio message</p>
                    </div>
                  </div>
                )}
                
                {message.attachmentURL && (message.attachmentType === 'file' || !message.attachmentType) && (
                  <div className="mb-2 bg-eclipse-background p-2 rounded flex items-center">
                    <PenSquare className="h-5 w-5 mr-2 text-eclipse-muted" />
                    <div className="overflow-hidden">
                      <p className="text-sm truncate">{message.attachmentName || "File attachment"}</p>
                    </div>
                  </div>
                )}
                
                <p>{message.content}</p>
              </div>
              
              {message.isGhost && message.sender === "user" && (
                <Clock size={16} className="text-eclipse-primary" />
              )}
            </div>
            
            <div className={cn(
              "flex items-center text-xs text-eclipse-muted mr-2 mt-1",
              message.sender === "user" ? "mr-2" : "ml-10"
            )}>
              <span>{message.timestamp}</span>
              {message.sender === "user" && message.read && (
                <span className="ml-1">· Read</span>
              )}
            </div>
            
            {/* Message reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={message.sender === "user" ? "mr-2" : "ml-10"}>
                <MessageReactions 
                  reactions={message.reactions}
                  currentUserId="current-user"
                  onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                  onRemoveReaction={(emoji) => handleRemoveReaction(message.id, emoji)}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-eclipse-border bg-eclipse-card">
        {attachmentPreview && attachment && (
          <div className="mb-3 p-2 bg-eclipse-background rounded-md flex items-center">
            {attachment.type?.startsWith('image/') ? (
              <div className="relative h-16 w-16 rounded overflow-hidden">
                <img 
                  src={attachmentPreview} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-0 right-0 h-5 w-5 bg-black/50 rounded-full"
                  onClick={cancelAttachment}
                >
                  <X size={10} />
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center">
                <div className="flex-1">
                  <p className="text-sm truncate">
                    {attachment instanceof File ? attachment.name : "Audio recording"}
                  </p>
                  <p className="text-xs text-eclipse-muted">
                    {attachment instanceof File && (
                      (attachment.size / 1024 < 1000) 
                      ? `${Math.round(attachment.size / 1024)} KB` 
                      : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                    )}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={cancelAttachment}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <AttachmentMenu
            onFileSelect={handleFileSelect}
            onAudioRecorded={handleAudioRecorded}
            triggerClassName="text-eclipse-muted hover:text-eclipse-text"
          />
          
          <div className="relative flex-1">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="pr-10 bg-eclipse-background border-eclipse-border"
            />
            <div className="absolute right-2 top-2">
              <EmojiPicker
                onEmojiSelect={addEmoji}
                triggerClassName="text-eclipse-muted hover:text-eclipse-text"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!messageInput.trim() && !attachment}
            className="bg-eclipse-primary hover:bg-eclipse-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      {/* User profile modal */}
      <UserProfileModal 
        open={showUserProfile} 
        onOpenChange={setShowUserProfile}
        user={{
          id: contact.id,
          name: contact.name,
          username: contact.name.toLowerCase().replace(/\s+/g, ''),
          avatar: contact.avatar,
          bio: "Privacy enthusiast and tech lover. End-to-end encryption advocate.",
          location: "Digital World",
          joined: "January 2025",
          isOnline: contact.online,
          ghostModeEnabled: true,
          mutualContacts: 5
        }}
      />
    </div>
  );
}
