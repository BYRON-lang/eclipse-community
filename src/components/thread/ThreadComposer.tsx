
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Image as ImageIcon,
  Video,
  BarChart3,
  Smile,
  X,
  Hash,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/firebase-auth-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ThreadComposerProps {
  onSubmit: (content: string, tags: string[], media: File[], isPoll: boolean, pollOptions: string[], pollDuration: number) => Promise<void>;
  isSubmitting?: boolean;
}

const MAX_CONTENT_LENGTH = 280;
const MAX_POLL_OPTIONS = 4;
const MAX_MEDIA_FILES = 4;
const MAX_TAG_LENGTH = 20;

export function ThreadComposer({ onSubmit, isSubmitting = false }: ThreadComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [media, setMedia] = useState<File[]>([]);
  const [mode, setMode] = useState<"text" | "poll">("text");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState(24); // hours
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea as content grows
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement> | null, forceAdd = false) => {
    if (e && e.key !== "Enter" && !forceAdd) return;
    
    const trimmedTag = currentTag.trim().toLowerCase();
    
    if (trimmedTag && 
        !tags.includes(trimmedTag) && 
        trimmedTag.length <= MAX_TAG_LENGTH && 
        tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia = Array.from(files);
    if (media.length + newMedia.length > MAX_MEDIA_FILES) {
      alert(`You can only add up to ${MAX_MEDIA_FILES} media files`);
      return;
    }

    setMedia([...media, ...newMedia]);

    // Create preview URLs
    const newPreviewUrls = newMedia.map(file => URL.createObjectURL(file));
    setMediaPreviewUrls([...mediaPreviewUrls, ...newPreviewUrls]);
  };

  const handleRemoveMedia = (index: number) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    
    setMedia(media.filter((_, i) => i !== index));
    setMediaPreviewUrls(mediaPreviewUrls.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < MAX_POLL_OPTIONS) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleAddEmoji = (emoji: any) => {
    setContent(prev => prev + emoji.native);
  };

  const canSubmit = () => {
    if (isSubmitting) return false;
    
    if (mode === "text") {
      return content.trim().length > 0 || media.length > 0;
    } else {
      // Poll mode
      return content.trim().length > 0 && 
             pollOptions.filter(option => option.trim().length > 0).length >= 2;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    
    const trimmedPollOptions = pollOptions.filter(option => option.trim().length > 0);
    
    await onSubmit(
      content,
      tags,
      media,
      mode === "poll",
      mode === "poll" ? trimmedPollOptions : [],
      pollDuration
    );
    
    // Reset form
    setContent("");
    setTags([]);
    setCurrentTag("");
    setMedia([]);
    setMediaPreviewUrls([]);
    setMode("text");
    setPollOptions(["", ""]);
  };

  const formatBulletPoints = () => {
    const lines = content.split('\n');
    const newLines = lines.map(line => line.trim().startsWith('•') ? line : `• ${line}`);
    setContent(newLines.join('\n'));
  };

  return (
    <div className="border-b border-eclipse-border px-4 py-2 bg-transparent">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
            {user?.displayName?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "poll")} className="mb-2">
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1">Thread</TabsTrigger>
              <TabsTrigger value="poll" className="flex-1">Poll</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mb-2">
            <textarea
              ref={contentRef}
              placeholder="What's happening?"
              value={content}
              onChange={handleContentChange}
              className="w-full bg-transparent border-none outline-none resize-none text-base min-h-[60px] placeholder:text-eclipse-muted"
            />
            
            {content.length > 0 && (
              <div className="flex items-center justify-between text-xs text-eclipse-muted">
                <span>{content.length}/{MAX_CONTENT_LENGTH}</span>
              </div>
            )}
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="gap-1 px-2 py-0.5 bg-eclipse-primary/10 hover:bg-eclipse-primary/15 text-xs"
                >
                  #{tag}
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-eclipse-danger"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {mode === "poll" && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-eclipse-primary" />
                <h3 className="font-medium text-sm">Poll Options</h3>
              </div>
              
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 h-8 text-sm"
                  />
                  {index >= 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePollOption(index)}
                      className="text-eclipse-muted hover:text-eclipse-danger h-8 w-8"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              
              {pollOptions.length < MAX_POLL_OPTIONS && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleAddPollOption}
                  className="w-full border-dashed h-8 text-xs"
                >
                  Add Option
                </Button>
              )}
              
              <div>
                <label className="block text-xs mb-1">Poll Duration</label>
                <select
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  className="w-full p-1 h-8 text-sm rounded-md border border-eclipse-border bg-eclipse-background"
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Media previews */}
          {media.length > 0 && (
            <div className={`grid gap-2 mb-3 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {mediaPreviewUrls.map((url, index) => (
                <div 
                  key={index} 
                  className={`relative ${media.length === 3 && index === 0 ? 'col-span-2' : ''} rounded-xl overflow-hidden`}
                >
                  {media[index].type.startsWith('video/') ? (
                    <video
                      src={url}
                      className="w-full h-24 object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={url}
                      alt="Media preview"
                      className="w-full h-24 object-cover"
                    />
                  )}
                  
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white p-0"
                    onClick={() => handleRemoveMedia(index)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3 border-t border-eclipse-border pt-2">
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
                onChange={handleFileSelect} 
                disabled={media.length >= MAX_MEDIA_FILES || mode === "poll"}
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={media.length >= MAX_MEDIA_FILES || mode === "poll"}
                className={cn(
                  "text-eclipse-primary rounded-full h-8 w-8 p-0",
                  (media.length >= MAX_MEDIA_FILES || mode === "poll") ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <ImageIcon size={18} />
                <span className="sr-only">Add Image</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => tagInputRef.current?.focus()}
                className="text-eclipse-primary rounded-full h-8 w-8 p-0"
              >
                <Hash size={18} />
                <span className="sr-only">Add Tag</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={formatBulletPoints}
                className="text-eclipse-primary rounded-full h-8 w-8 p-0"
              >
                <List size={18} />
                <span className="sr-only">Format as Bullet Points</span>
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-eclipse-primary rounded-full h-8 w-8 p-0"
                  >
                    <Smile size={18} />
                    <span className="sr-only">Add Emoji</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-eclipse-border" align="start">
                  <Picker 
                    data={data} 
                    onEmojiSelect={handleAddEmoji}
                    theme="light"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className={cn(
                "text-white rounded-full px-4 py-1 h-8 text-sm",
                !canSubmit() ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
          
          {/* Tag input (hidden by default) */}
          <div className="mt-2 flex items-center gap-2 px-1 hidden">
            <Hash size={14} className="text-eclipse-muted" />
            <Input
              ref={tagInputRef}
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag (hit Enter)"
              className="flex-1 h-7 bg-transparent border-none text-sm"
              maxLength={MAX_TAG_LENGTH}
              disabled={tags.length >= 5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
