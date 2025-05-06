
import React, { useState } from "react";
import { PollVote } from "./PollVote";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  UserPlus,
  Flag, 
  MoreHorizontal, 
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Thread } from "@/services/thread-service";
import { formatDistanceToNow } from "date-fns";
import { optimizeImage } from "@/utils/image-optimization";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadCardProps {
  thread: Thread;
  onLike: (threadId: string) => Promise<void>;
  onBookmark: (threadId: string) => Promise<void>;
  onFollow: (userId: string) => Promise<void>;
  onBlock: (userId: string) => Promise<void>;
  onReport: (userId: string) => void;
  onOpenThread: (threadId: string) => void;
  onShare: (threadId: string) => Promise<void>;
  compact?: boolean;
  isMobile?: boolean;
}

const MAX_CONTENT_LENGTH = 280;

export function ThreadCard({ 
  thread, 
  onLike, 
  onBookmark, 
  onFollow, 
  onBlock, 
  onReport, 
  onOpenThread,
  onShare,
  compact = false 
}: ThreadCardProps) {
  const [expanded, setExpanded] = useState(false);

  const needsExpansion = thread.content.length > MAX_CONTENT_LENGTH;
  
  const displayContent = needsExpansion && !expanded 
    ? `${thread.content.slice(0, MAX_CONTENT_LENGTH)}...` 
    : thread.content;
  
  const handleReadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
  };
  
  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };
  
  const cardClasses = cn(
    "border-b border-eclipse-border px-4 py-3 hover:bg-eclipse-background/10 transition-colors cursor-pointer max-w-2xl mx-auto w-full",
    compact ? "py-2 px-3" : ""
  );
  
  return (
    <div className={cardClasses} onClick={() => onOpenThread(thread.id)}>
      <div className="flex gap-3">
        <div>
          <Avatar className={compact ? "h-9 w-9" : "h-10 w-10"}>
            <AvatarImage src={thread.authorAvatar} alt={thread.authorName} />
            <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
              {thread.authorName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <div className="inline-flex items-center">
                <span className="font-semibold hover:underline mr-1">
                  {thread.authorName}
                </span>
                {thread.verified && (
                  <span className="text-eclipse-primary">
                    <Check size={16} className="bg-eclipse-primary text-white rounded-full p-1 h-4 w-4" />
                  </span>
                )}
              </div>
              <span className="text-eclipse-muted text-sm">
                @{thread.authorUsername || thread.authorName.toLowerCase().replace(/\s+/g, '')}
              </span>
              <span className="text-eclipse-muted text-sm">·</span>
              <span className="text-eclipse-muted text-sm">
                {formatTimestamp(thread.createdAt)}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full text-eclipse-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={16} />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onFollow(thread.authorId);
                }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Follow @{thread.authorUsername}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(thread.id);
                }}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  <span>{thread.isBookmarked ? 'Remove bookmark' : 'Bookmark'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onShare(thread.id);
                }}>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onBlock(thread.authorId);
                }} className="text-eclipse-danger">
                  <Flag className="mr-2 h-4 w-4" />
                  <span>Block user</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onReport(thread.authorId);
                }} className="text-eclipse-danger">
                  <Flag className="mr-2 h-4 w-4" />
                  <span>Report thread</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Content */}
          <div className="mt-1 whitespace-pre-wrap">
            <p className="text-[15px] leading-normal">{displayContent}</p>
            {needsExpansion && !expanded && (
              <button
                className="text-eclipse-primary hover:underline text-sm font-medium mt-1"
                onClick={handleReadMore}
              >
                Show more
              </button>
            )}
          </div>
          
          {/* Media */}
          {thread.media && thread.media.length > 0 && (
            <div className={`mt-3 grid gap-1 rounded-xl overflow-hidden ${thread.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {thread.media.map((url, index) => {
                if (!url) return null;
                const mediaUrl = typeof url === 'string' ? url : '';
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm');
                
                // Apply image optimization for faster loading
                const optimizedUrl = isVideo ? mediaUrl : optimizeImage(mediaUrl);
                
                // Set appropriate styling based on media count
                const isFirstInOddCollection = thread.media.length === 3 && index === 0;
                const aspectClass = isFirstInOddCollection ? 'aspect-[16/9]' : 'aspect-square';
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "relative overflow-hidden",
                      isFirstInOddCollection && "col-span-2",
                      thread.media.length === 1 && "rounded-xl"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isVideo ? (
                      <video 
                        src={optimizedUrl} 
                        className={`w-full h-full object-cover ${aspectClass}`} 
                        controls
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <img 
                        src={optimizedUrl} 
                        alt={`Media from ${thread.authorName}`}
                        className={`w-full h-full object-cover ${aspectClass}`} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Tags */}
          {thread.tags && thread.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-2 mt-2">
              {thread.tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs bg-eclipse-primary/5 hover:bg-eclipse-primary/10 transition-colors"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Poll */}
          {thread.isPoll && thread.pollOptions && thread.pollOptions.length > 0 && (
            <PollVote 
              thread={thread} 
              onVoteComplete={() => onOpenThread(thread.id)} 
            />
          )}
          
          {/* Action bar */}
          <div className="flex justify-between items-center mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "text-eclipse-muted hover:text-eclipse-primary p-0 h-auto gap-1.5",
                compact ? "text-xs" : "text-sm"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onOpenThread(thread.id);
              }}
            >
              <MessageSquare size={compact ? 16 : 18} />
              {thread.commentCount > 0 && thread.commentCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-eclipse-muted hover:text-eclipse-danger p-0 h-auto gap-1.5",
                thread.isLiked ? "text-eclipse-danger" : "",
                compact ? "text-xs" : "text-sm"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onLike(thread.id);
              }}
            >
              <Heart 
                size={compact ? 16 : 18} 
                className={thread.isLiked ? "fill-eclipse-danger" : ""} 
              />
              {thread.likeCount > 0 && thread.likeCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-eclipse-muted hover:text-eclipse-primary p-0 h-auto gap-1.5",
                compact ? "text-xs" : "text-sm"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(thread.id);
              }}
            >
              <Bookmark
                size={compact ? 16 : 18}
                className={thread.isBookmarked ? "fill-eclipse-primary" : ""} 
              />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-eclipse-muted hover:text-eclipse-primary p-0 h-auto gap-1.5",
                compact ? "text-xs" : "text-sm"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onShare(thread.id);
              }}
            >
              <Share2 size={compact ? 16 : 18} />
              {thread.shareCount > 0 && thread.shareCount}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
