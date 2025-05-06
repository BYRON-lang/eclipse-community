
import React, { useState, useEffect } from "react";
import { ThreadCard } from "./ThreadCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Reply, Smile, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Thread, ThreadComment, addComment, getThreadComments, toggleCommentLike, addCommentReaction } from "@/services/thread-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/firebase-auth-context";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ThreadDetailProps {
  thread: Thread;
  onLike: (threadId: string) => Promise<void>;
  onBookmark: (threadId: string) => Promise<void>;
  onFollow: (userId: string) => Promise<void>;
  onBlock: (userId: string) => Promise<void>;
  onReport: (userId: string) => void;
  onShare: (threadId: string) => Promise<void>;
  open: boolean;
  onClose: () => void;
}

export function ThreadDetail({
  thread,
  onLike,
  onBookmark,
  onFollow,
  onBlock,
  onReport,
  onShare,
  open,
  onClose
}: ThreadDetailProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentMedia, setCommentMedia] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (open && thread?.id) {
      loadComments();
    }
  }, [open, thread?.id]);
  
  const loadComments = async () => {
    if (!thread) return;
    
    setLoadingComments(true);
    try {
      const fetchedComments = await getThreadComments(thread.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleCommentSubmit = async () => {
    if (!commentText.trim() && commentMedia.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await addComment(thread.id, commentText, commentMedia);
      setCommentText("");
      setCommentMedia([]);
      setMediaPreviewUrls([]);
      loadComments(); // Refresh comments
      
      toast({
        title: "Success",
        description: "Comment added"
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia = Array.from(files);
    if (commentMedia.length + newMedia.length > 2) {
      toast({
        title: "Limit exceeded",
        description: "You can only add up to 2 media files per comment",
        variant: "destructive"
      });
      return;
    }

    setCommentMedia([...commentMedia, ...newMedia]);

    // Create preview URLs
    const newPreviewUrls = newMedia.map(file => URL.createObjectURL(file));
    setMediaPreviewUrls([...mediaPreviewUrls, ...newPreviewUrls]);
  };

  const handleRemoveMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    
    setCommentMedia(commentMedia.filter((_, i) => i !== index));
    setMediaPreviewUrls(mediaPreviewUrls.filter((_, i) => i !== index));
  };
  
  const handleToggleLike = async (commentId: string) => {
    try {
      const isLiked = await toggleCommentLike(commentId);
      
      // Update comment in the UI
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              isLiked,
              likeCount: isLiked ? comment.likeCount + 1 : comment.likeCount - 1
            }
          : comment
      ));
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      });
    }
  };
  
  const handleAddEmoji = (emoji: any) => {
    setCommentText(prev => prev + emoji.native);
  };
  
  const handleAddReaction = async (commentId: string, emoji: any) => {
    try {
      await addCommentReaction(commentId, emoji.native);
      
      // Update UI optimistically
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              reactions: {
                ...(comment.reactions || {}),
                [emoji.native]: ((comment.reactions || {})[emoji.native] || 0) + 1
              }
            }
          : comment
      ));
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive"
      });
    }
  };
  
  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  if (!open || !thread) return null;
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-opacity-80 backdrop-blur-md p-4 border-b border-eclipse-border">
          <DialogTitle>Thread</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <ThreadCard
            thread={thread}
            onLike={onLike}
            onBookmark={onBookmark}
            onFollow={onFollow}
            onBlock={onBlock}
            onReport={onReport}
            onOpenThread={() => {}}
            onShare={onShare}
          />
          
          <div className="p-4 border-y border-eclipse-border bg-eclipse-background/30">
            <h3 className="font-medium mb-3">Comments</h3>
            
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                />
                
                {/* Media previews */}
                {commentMedia.length > 0 && (
                  <div className={`grid gap-2 mt-2 ${commentMedia.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {mediaPreviewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        {commentMedia[index].type.startsWith('video/') ? (
                          <video
                            src={url}
                            className="w-full h-24 object-cover rounded-lg"
                            controls
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Media preview"
                            className="w-full h-24 object-cover rounded-lg"
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
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      multiple 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={commentMedia.length >= 2}
                      className="h-8 w-8 rounded-full text-eclipse-primary p-0"
                    >
                      <ImageIcon size={16} />
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-eclipse-primary p-0"
                        >
                          <Smile size={16} />
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
                    size="sm"
                    disabled={(!commentText.trim() && commentMedia.length === 0) || isSubmitting}
                    onClick={handleCommentSubmit}
                    className="rounded-full px-4"
                  >
                    {isSubmitting ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {loadingComments ? (
            <div className="p-8 text-center text-eclipse-muted">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-eclipse-muted">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="divide-y divide-eclipse-border">
              {comments.map(comment => (
                <div key={comment.id} className="p-4 hover:bg-eclipse-background/30 transition-colors">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback className="bg-eclipse-primary/10 text-eclipse-primary">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium mr-1">
                            {comment.authorName}
                          </span>
                          <span className="text-sm text-eclipse-muted">
                            @{comment.authorUsername || comment.authorName.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="text-xs text-eclipse-muted ml-2">
                            {formatTimestamp(comment.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Comment media */}
                      {comment.media && comment.media.length > 0 && (
                        <div className={`grid gap-2 mt-2 ${comment.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {comment.media.map((url, index) => (
                            <div key={index} className="relative">
                              {url.includes('.mp4') || url.includes('.webm') ? (
                                <video
                                  src={url}
                                  className="w-full max-h-48 object-cover rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt="Comment media"
                                  className="w-full max-h-48 object-cover rounded-lg"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Comment reactions */}
                      {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(comment.reactions).map(([emoji, count]) => (
                            count > 0 && (
                              <div 
                                key={emoji} 
                                className="flex items-center bg-eclipse-background px-2 py-1 rounded-full text-sm"
                              >
                                <span className="mr-1">{emoji}</span>
                                <span className="text-eclipse-muted text-xs">{count}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLike(comment.id)}
                          className={cn(
                            "p-0 h-auto gap-1 text-xs",
                            comment.isLiked ? "text-eclipse-danger" : "text-eclipse-muted hover:text-eclipse-danger"
                          )}
                        >
                          <Heart 
                            size={14} 
                            className={comment.isLiked ? "fill-eclipse-danger" : ""} 
                          />
                          {comment.likeCount > 0 && comment.likeCount}
                        </Button>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-eclipse-muted hover:text-eclipse-primary"
                            >
                              <Smile size={14} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 border-eclipse-border" align="start">
                            <Picker 
                              data={data} 
                              onEmojiSelect={(emoji: any) => handleAddReaction(comment.id, emoji)}
                              theme="light"
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto text-eclipse-muted hover:text-eclipse-primary"
                        >
                          <Reply size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
