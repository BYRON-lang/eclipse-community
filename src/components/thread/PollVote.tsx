import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { Thread } from '@/services/thread-service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { voteOnPoll } from '@/services/thread-service';

interface PollVoteProps {
  thread: Thread;
  onVoteComplete?: () => void;
}

export function PollVote({ thread, onVoteComplete }: PollVoteProps) {
  const handleVote = async (optionId: string) => {
    try {
      await voteOnPoll(thread.id, optionId);
      toast.success('Vote recorded');
      if (onVoteComplete) {
        onVoteComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to vote');
    }
  };

  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  if (!thread.isPoll || !thread.pollOptions) return null;

  const totalVotes = thread.pollOptions.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={16} className="text-eclipse-muted" />
        <span className="text-sm font-medium">Poll</span>
        {thread.pollEndsAt && (
          <span className="text-xs text-eclipse-muted">
            {new Date() > thread.pollEndsAt 
              ? "Poll ended" 
              : `Ends ${formatTimestamp(thread.pollEndsAt)}`}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {thread.pollOptions.map(option => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const hasEnded = thread.pollEndsAt && new Date() > thread.pollEndsAt;
          
          return (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "relative w-full justify-between hover:bg-eclipse-background/80 h-auto py-3",
                hasEnded && "cursor-default"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasEnded) {
                  handleVote(option.id);
                }
              }}
              disabled={hasEnded}
            >
              <div className="absolute left-0 top-0 h-full bg-eclipse-primary/10 z-0" 
                style={{ width: `${percentage}%` }}
              />
              <div className="flex justify-between w-full relative z-10">
                <span>{option.text}</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <div className="relative z-10 text-xs text-eclipse-muted mt-1">
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}