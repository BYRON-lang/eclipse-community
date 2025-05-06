// Import statements
import React, { useState, useEffect } from 'react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatButton from '../components/chat/NewChatButton';
import { UserProfileModal } from '../components/chat/UserProfileModal';
import { useAuth } from '../contexts/firebase-auth-context';
import { auth } from '../lib/firebase';
import { 
  getChatList, 
  getMessages, 
  sendMessage, 
  createNewChat,
  Message as ChatServiceMessage,
  Chat as ChatType
} from '../services/chat-service';
import { getUserProfile } from '../services/thread-service';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';

// Explicitly define Message interface to avoid conflicts
interface ComponentMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  mediaUrl?: string;
  reactions?: { [key: string]: number };
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
}

// Convert service message to component message
const convertServiceMessageToMessage = (message: ChatServiceMessage): ComponentMessage => {
  return {
    id: message.id,
    content: message.content,
    sender: {
      id: message.senderId,
      name: message.senderName || 'User',
      avatar: message.attachmentURL, // Use appropriate property or undefined
    },
    timestamp: message.timestamp,
    isRead: message.read || false,
    type: message.attachmentType ? message.attachmentType : 'text',
    mediaUrl: message.attachmentURL,
    reactions: {}, // Initialize empty reactions object as it doesn't exist in service message
    replyTo: undefined // Initialize as undefined as it doesn't exist in service message
  };
};

// Rest of the component code
const ChatsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<ComponentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Load chat list on component mount
  useEffect(() => {
    const loadChats = async () => {
      if (user) {
        try {
          getChatList((chatList) => {
            setChats(chatList);
            
            // Check if there's a chat ID in the URL
            const chatId = searchParams.get('id');
            if (chatId) {
              const chat = chatList.find(c => c.id === chatId);
              if (chat) {
                setSelectedChat(chat);
                loadChatMessages(chatId);
              }
            }
            
            setLoading(false);
          });
        } catch (error) {
          console.error('Error loading chats:', error);
          toast({
            title: 'Error',
            description: 'Failed to load chats. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
        }
      }
    };
    
    loadChats();
  }, [user, searchParams, toast]);
  
  // Function to load chat messages
  const loadChatMessages = async (chatId: string) => {
    try {
      setLoading(true);
      
      // Make sure to convert service messages to component messages
      getMessages(chatId, (chatMessages) => {
        setMessages(chatMessages.map(convertServiceMessageToMessage));
        
        // Update URL with chat ID
        setSearchParams({ id: chatId });
        
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  // Handle chat selection
  const handleSelectChat = (chat: ChatType) => {
    setSelectedChat(chat);
    loadChatMessages(chat.id);
  };
  
  // Handle new message
  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' | 'audio' | 'video', mediaUrl?: string) => {
    if (!selectedChat || !user) return;
    
    try {
      await sendMessage(selectedChat.id, content, type, mediaUrl);
      
      // Messages will be updated automatically through the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new chat
  const handleCreateChat = async (userId: string) => {
    if (!user) return;
    
    try {
      const chatId = await createNewChat([userId]);
      // Chat list will update automatically through subscription
      setSelectedChat(null); // Reset selection
      loadChatMessages(chatId); // Load messages for new chat
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle user profile click
  const handleUserProfileClick = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      setSelectedUser(userProfile);
      setShowUserProfile(true);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-eclipse-background">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-eclipse-border bg-eclipse-card">
        <h2 className="text-xl font-semibold">Messages</h2>
        <NewChatButton />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat list sidebar */}
        <div className="w-1/4 border-r border-eclipse-border h-full overflow-y-auto">
          <ChatList 
            chats={chats.map(chat => ({
              id: chat.id,
              name: Object.values(chat.participants)[0]?.name || 'Unknown',
              avatar: Object.values(chat.participants)[0]?.photoURL,
              lastMessage: chat.lastMessage?.content || '',
              time: chat.lastMessage?.timestamp.toLocaleTimeString() || '',
              unread: 0,
              online: true,
              isGhost: false
            }))} 
            selectedChatId={selectedChat?.id} 
            onSelectChat={(chatId) => handleSelectChat(chats.find(chat => chat.id === chatId) || chats[0])}
          />
        </div>
        
        {/* Chat window */}
        <div className="w-3/4 h-full flex flex-col">
          {selectedChat ? (
            <ChatWindow 
              contact={{
                id: selectedChat.id,
                name: Object.values(selectedChat.participants)[0]?.name || 'Unknown',
                avatar: Object.values(selectedChat.participants)[0]?.photoURL,
                online: true,
                isTyping: false
              }}
              messages={messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender.id === user?.uid ? 'user' : 'contact',
                timestamp: msg.timestamp.toISOString(),
                read: Boolean(msg.isRead),
                attachmentURL: msg.mediaUrl,
                attachmentType: msg.type === 'text' ? undefined : msg.type
              }))}
              onSendMessage={(content, attachment) => {
                // Convert File/Blob to appropriate format for handleSendMessage
                if (attachment) {
                  const type = attachment.type.startsWith('image/') ? 'image' : 
                               attachment.type.startsWith('audio/') ? 'audio' : 
                               attachment.type.startsWith('video/') ? 'video' : 'file';
                  const mediaUrl = URL.createObjectURL(attachment);
                  handleSendMessage(content, type, mediaUrl);
                } else {
                  handleSendMessage(content, 'text');
                }
              }}
              onToggleGhostMode={() => {}}
              ghostModeActive={false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-eclipse-muted">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">No chat selected</h3>
                <p>Select a chat from the sidebar or start a new conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* User profile modal */}
      {showUserProfile && selectedUser && (
        <UserProfileModal 
          user={selectedUser}
          open={Boolean(showUserProfile)}
          onOpenChange={setShowUserProfile}
          onStartChat={handleCreateChat}
        />
      )}
    </div>
  );
};

export default ChatsPage;
