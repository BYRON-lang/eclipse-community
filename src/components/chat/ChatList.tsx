
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGhost: boolean;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-eclipse-card border-r border-eclipse-border">
      <div className="p-4 border-b border-eclipse-border">
        <h2 className="text-lg font-medium mb-4">Chats</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-eclipse-muted" />
          <Input 
            placeholder="Search chats" 
            className="pl-8 bg-eclipse-background border-eclipse-border"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "flex items-center p-3 cursor-pointer transition-colors hover:bg-eclipse-background",
              selectedChatId === chat.id && "bg-eclipse-background"
            )}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                  {chat.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {chat.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-eclipse-card"></span>
              )}
              {chat.isGhost && (
                <div className="absolute -top-1 -right-1 bg-eclipse-primary rounded-full p-0.5">
                  <Clock size={10} className="text-black" />
                </div>
              )}
            </div>
            
            <div className="ml-3 flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="font-medium truncate">{chat.name}</span>
                <span className="text-xs text-eclipse-muted">{chat.time}</span>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-eclipse-muted truncate">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="ml-2 bg-eclipse-primary text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
