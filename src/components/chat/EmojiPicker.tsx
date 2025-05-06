
import React, { useEffect, useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  triggerClassName?: string;
}

export function EmojiPicker({ onEmojiSelect, triggerClassName }: EmojiPickerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration issues by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className={triggerClassName}
        type="button"
      >
        <Smile className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={triggerClassName}
          type="button"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0 border-eclipse-border bg-eclipse-card" 
        align="end"
        side="top"
      >
        <Picker
          data={data}
          onEmojiSelect={(emoji: any) => {
            onEmojiSelect(emoji.native);
          }}
          theme="dark"
          set="native"
          previewPosition="none"
        />
      </PopoverContent>
    </Popover>
  );
}
