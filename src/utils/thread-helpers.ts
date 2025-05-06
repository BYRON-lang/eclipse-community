
import { Thread } from '@/services/thread-service';

/**
 * Format thread content for display
 * @param content The original thread content
 * @param maxLength Maximum characters to show before truncating
 * @returns Formatted content
 */
export const formatThreadContent = (content: string, maxLength?: number): string => {
  if (!content) return '';
  
  // Replace URLs with clickable links
  let formatted = content.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" class="text-eclipse-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Replace @mentions with styled mentions
  formatted = formatted.replace(
    /@(\w+)/g,
    '<span class="text-eclipse-primary">@$1</span>'
  );
  
  // Replace #hashtags with styled hashtags
  formatted = formatted.replace(
    /#(\w+)/g,
    '<span class="text-eclipse-primary">#$1</span>'
  );
  
  // Apply character limit if specified
  if (maxLength && formatted.length > maxLength) {
    return formatted.substring(0, maxLength) + '...';
  }
  
  return formatted;
};

/**
 * Extract mentions from a thread's content
 * @param content The thread content
 * @returns Array of mentioned usernames
 */
export const extractMentions = (content: string): string[] => {
  const mentions = content.match(/@(\w+)/g) || [];
  return mentions.map(mention => mention.substring(1));
};

/**
 * Extract hashtags from a thread's content
 * @param content The thread content
 * @returns Array of hashtags
 */
export const extractHashtags = (content: string): string[] => {
  const hashtags = content.match(/#(\w+)/g) || [];
  return hashtags.map(tag => tag.substring(1));
};

/**
 * Sort threads by various criteria
 * @param threads Array of threads
 * @param sortType Sort type (recent, popular, trending)
 * @returns Sorted array of threads
 */
export const sortThreads = (
  threads: Thread[], 
  sortType: 'recent' | 'popular' | 'trending' = 'recent'
): Thread[] => {
  switch (sortType) {
    case 'recent':
      return [...threads].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    
    case 'popular':
      return [...threads].sort(
        (a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount)
      );
      
    case 'trending':
      // Calculate a simple trending score based on recency and engagement
      const now = new Date();
      return [...threads].sort((a, b) => {
        const aAge = (now.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60); // Age in hours
        const bAge = (now.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60);
        
        // Score formula: (likes + comments*2 + shares*3) / (age^1.5 + 2)
        const aScore = (a.likeCount + (a.commentCount * 2) + ((a.shareCount || 0) * 3)) / 
                       (Math.pow(aAge + 2, 1.5));
        const bScore = (b.likeCount + (b.commentCount * 2) + ((b.shareCount || 0) * 3)) / 
                       (Math.pow(bAge + 2, 1.5));
        
        return bScore - aScore;
      });
      
    default:
      return threads;
  }
};

/**
 * Filter threads by search term
 * @param threads Array of threads
 * @param searchTerm Search term
 * @returns Filtered array of threads
 */
export const filterThreadsBySearch = (
  threads: Thread[],
  searchTerm: string
): Thread[] => {
  if (!searchTerm) return threads;
  
  const term = searchTerm.toLowerCase();
  
  return threads.filter(thread => {
    return (
      thread.content.toLowerCase().includes(term) ||
      thread.authorName.toLowerCase().includes(term) ||
      (thread.authorUsername && thread.authorUsername.toLowerCase().includes(term)) ||
      thread.tags.some(tag => tag.toLowerCase().includes(term))
    );
  });
};

/**
 * Group threads by date for better display
 * @param threads Array of threads
 * @returns Object with threads grouped by date 
 */
export const groupThreadsByDate = (threads: Thread[]): Record<string, Thread[]> => {
  const grouped: Record<string, Thread[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  threads.forEach(thread => {
    const threadDate = thread.createdAt.toDateString();
    
    let dateKey: string;
    if (threadDate === today) {
      dateKey = 'Today';
    } else if (threadDate === yesterday) {
      dateKey = 'Yesterday';
    } else {
      dateKey = threadDate;
    }
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(thread);
  });
  
  return grouped;
};
