
import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}

export function MessageReactions({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction
}: MessageReactionsProps) {
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "👏"];
  
  const toggleReaction = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    
    if (reaction && reaction.users.includes(currentUserId)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };
  
  return (
    <div className="flex items-center mt-1 space-x-1">
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {reactions.map(reaction => (
            <Button
              key={reaction.emoji}
              variant="outline"
              size="sm"
              className={cn(
                "h-6 px-2 py-1 text-xs border-eclipse-border",
                reaction.users.includes(currentUserId) && "bg-eclipse-primary/10"
              )}
              onClick={() => toggleReaction(reaction.emoji)}
            >
              <span className="mr-1">{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </Button>
          ))}
        </div>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-eclipse-muted hover:text-eclipse-text"
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2 border-eclipse-border bg-eclipse-card"
          align="start"
          side="top"
        >
          <div className="flex gap-1">
            {quickReactions.map(emoji => (
              <Button 
                key={emoji} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  toggleReaction(emoji);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
