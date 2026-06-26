import React, { useState, useEffect, useRef } from 'react';
import { User, Message, VisualSettings, TeamConversation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  MoreVertical,
  Info,
  ArrowLeft,
  Smile,
  Hash,
  Plus,
  X
} from 'lucide-react';

interface MessagingPortalProps {
  users: User[];
  currentUser: User;
  messages: Message[];
  onSendMessage: (text: string, receiverId: string) => void;
  onMarkRead: (senderId: string) => void;
  visualSettings: VisualSettings;
  initialUserId?: string | null;
  teamConversations?: TeamConversation[];
  onAddTeamConversation?: (name: string, description?: string) => void;
}

export const MessagingPortal: React.FC<MessagingPortalProps> = ({
  users,
  currentUser,
  messages,
  onSendMessage,
  onMarkRead,
  visualSettings,
  initialUserId = null,
  teamConversations = [],
  onAddTeamConversation
}) => {
  // Default to general channel if no initial selection is active, or use initialUserId
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialUserId || 'channel-general');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevChannelsCount = useRef(teamConversations.length);

  const selectedUser = users.find(u => u.id === selectedChatId);
  const selectedChannel = teamConversations.find(c => c.id === selectedChatId);

  // Auto-focus on new channels created by current user
  useEffect(() => {
    if (teamConversations.length > prevChannelsCount.current) {
      const myLastChannel = [...teamConversations]
        .reverse()
        .find(c => c.createdBy === currentUser.id);
      if (myLastChannel) {
        setSelectedChatId(myLastChannel.id);
      }
    }
    prevChannelsCount.current = teamConversations.length;
  }, [teamConversations, currentUser.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedChatId) {
      scrollToBottom();
    }
  }, [selectedChatId, messages.length]);

  // Mark private messages as read and update channel last viewed timestamp
  useEffect(() => {
    if (selectedChatId) {
      if (selectedChatId.startsWith('channel-')) {
        localStorage.setItem(`channel_last_viewed_${selectedChatId}`, new Date().toISOString());
      } else {
        const hasUnread = messages.some(
          m => m.senderId === selectedChatId && m.receiverId === currentUser.id && !m.read
        );
        if (hasUnread) {
          onMarkRead(selectedChatId);
        }
      }
    }
  }, [selectedChatId, messages, currentUser.id, onMarkRead]);

  // Retrieve active conversation messages (private or channel)
  const conversationMessages = messages.filter(m => {
    if (selectedChatId?.startsWith('channel-')) {
      return m.receiverId === selectedChatId;
    } else {
      return (m.senderId === currentUser.id && m.receiverId === selectedChatId) ||
             (m.senderId === selectedChatId && m.receiverId === currentUser.id);
    }
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatId) return;
    onSendMessage(messageText, selectedChatId);
    setMessageText('');
    
    // Set immediate last viewed for active channel to avoid unread flushes
    if (selectedChatId.startsWith('channel-')) {
      localStorage.setItem(`channel_last_viewed_${selectedChatId}`, new Date().toISOString());
    }
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    if (onAddTeamConversation) {
      onAddTeamConversation(newChannelName.trim(), newChannelDesc.trim());
    }
    setNewChannelName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
  };

  // Filters for Search Bar
  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredChannels = teamConversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUnreadCount = (chatId: string) => {
    const isChannel = chatId.startsWith('channel-');
    if (isChannel) {
      if (selectedChatId === chatId) return 0;
      const lastViewed = localStorage.getItem(`channel_last_viewed_${chatId}`);
      if (!lastViewed) return 0; // standard default
      return messages.filter(
        m => m.receiverId === chatId && 
             m.senderId !== currentUser.id && 
             new Date(m.createdAt).getTime() > new Date(lastViewed).getTime()
      ).length;
    }
    return messages.filter(m => m.senderId === chatId && m.receiverId === currentUser.id && !m.read).length;
  };

  const getLastMessage = (chatId: string) => {
    const isChannel = chatId.startsWith('channel-');
    const userMsgs = messages.filter(m => {
      if (isChannel) {
        return m.receiverId === chatId;
      } else {
        return (m.senderId === currentUser.id && m.receiverId === chatId) ||
               (m.senderId === chatId && m.receiverId === currentUser.id);
      }
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userMsgs[0];
  };

  return (
    <div className="flex h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)] bg-white border-y sm:border border-slate-200 rounded-none sm:rounded-2xl shadow-sm overflow-hidden w-full max-w-full min-w-0 relative">
      
      {/* Sidebar - Contacts & Team Channels */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Messages</h2>
            <div className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
              <MoreVertical className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Channels & DM lists */}
        <div className="flex-1 overflow-y-auto p-2 space-y-5">
          
          {/* Section: Team Conversations */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Team Conversations</span>
              <button 
                onClick={() => setShowCreateChannelModal(true)}
                className="p-1 hover:bg-slate-250 text-slate-500 hover:text-indigo-650 rounded-md transition-colors cursor-pointer"
                title="Create Team Conversation"
              >
                <Plus className="w-5.5 h-5.5" />
              </button>
            </div>
            
            {filteredChannels.length === 0 && searchQuery ? (
              <p className="text-[11px] italic text-slate-400 px-2 py-1">No channels found</p>
            ) : (
              filteredChannels.map(channel => {
                const lastMsg = getLastMessage(channel.id);
                const unreadCount = getUnreadCount(channel.id);
                const isSelected = selectedChatId === channel.id;

                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChatId(channel.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${
                      isSelected ? 'bg-white shadow-3xs ring-1 ring-slate-150' : 'hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Hash className="w-6.5 h-6.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">#{channel.name}</span>
                        {lastMsg && (
                          <span className="text-[9px] text-slate-455">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] truncate ${unreadCount > 0 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                          {lastMsg ? (
                            <>
                              <span className="font-semibold text-slate-700">
                                {users.find(u => u.id === lastMsg.senderId)?.name.split(' ')[0] || 'User'}:
                              </span>{' '}
                              {lastMsg.text}
                            </>
                          ) : (
                            <span className="italic text-slate-400">No messages yet</span>
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Section: Direct Messages */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Direct Messages</span>
            </div>
            
            {filteredUsers.length === 0 && searchQuery ? (
              <p className="text-[11px] italic text-slate-400 px-2 py-1">No members found</p>
            ) : (
              filteredUsers.map(user => {
                const lastMsg = getLastMessage(user.id);
                const unreadCount = getUnreadCount(user.id);
                const isSelected = selectedChatId === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedChatId(user.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${
                      isSelected ? 'bg-white shadow-3xs ring-1 ring-slate-150' : 'hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {user.name[0]}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${user.deactivated ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{user.name}</span>
                        {lastMsg && (
                          <span className="text-[9px] text-slate-455">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] truncate ${unreadCount > 0 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                          {lastMsg ? (
                            lastMsg.senderId === currentUser.id ? `You: ${lastMsg.text}` : lastMsg.text
                          ) : (
                            <span className="italic text-slate-400">Start a conversation</span>
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 w-full flex flex-col bg-white min-w-0 ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser || selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 w-full min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative group md:hidden shrink-0">
                  <button 
                    onClick={() => setSelectedChatId(null)}
                    className="p-3 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all shrink-0 cursor-pointer"
                    aria-label="Back to conversations list"
                  >
                    <ArrowLeft className="w-9 h-9 text-slate-600" />
                  </button>
                  <span className="absolute top-full mt-2 left-0 px-2.5 py-1 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 ease-out -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50 shadow-md ring-1 ring-white/10">
                    Back to List
                  </span>
                </div>
                <div className="shrink-0">
                  {selectedChannel ? (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Hash className="w-8 h-8" />
                    </div>
                  ) : selectedUser?.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {selectedUser?.name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                    {selectedChannel ? `#${selectedChannel.name}` : selectedUser?.name}
                  </h3>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {selectedChannel ? (
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-md block">
                        {selectedChannel.description || 'Welcome to this team conversation.'}
                      </span>
                    ) : (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedUser?.deactivated ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          {selectedUser?.deactivated ? 'Offline' : 'Online'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <div className="relative group">
                  <button className="p-3 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-all cursor-pointer" aria-label="Conversation Details">
                    <Info className="w-8 h-8" />
                  </button>
                  <span className="absolute top-full mt-2 right-0 px-2.5 py-1 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 ease-out -translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50 shadow-md ring-1 ring-white/10">
                    Conversation Details
                  </span>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/20 w-full min-w-0">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                  <MessageSquare className="w-12 h-12 stroke-1" />
                  <p className="text-xs font-medium">This conversation is quiet. Say hello!</p>
                </div>
              ) : (
                conversationMessages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const showAvatar = idx === 0 || conversationMessages[idx - 1].senderId !== msg.senderId;
                  const msgSender = users.find(u => u.id === msg.senderId);

                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} w-full min-w-0`}>
                      {!isMe && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            msgSender?.avatarUrl ? (
                              <img src={msgSender.avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                {msgSender?.name[0] || 'U'}
                              </div>
                            )
                          )}
                        </div>
                      )}
                      <div className={`max-w-[75%] sm:max-w-[70%] space-y-0.5 flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
                        {selectedChannel && !isMe && showAvatar && msgSender && (
                          <span className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block truncate max-w-full">
                            {msgSender.name}
                          </span>
                        )}
                        <div 
                          className={`px-4 py-2 text-xs font-medium rounded-2xl shadow-3xs break-words overflow-hidden max-w-full ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-1 pt-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[8px] text-slate-400 font-medium">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && !selectedChannel && (
                            <CheckCircle2 className={`w-4.5 h-4.5 ${msg.read ? 'text-indigo-400' : 'text-slate-300'} shrink-0`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-100 w-full min-w-0">
              <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative group">
                    <button type="button" className="p-3 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-all cursor-pointer" aria-label="Add Emoji">
                      <Smile className="w-8 h-8" />
                    </button>
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 ease-out translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50 shadow-md ring-1 ring-white/10">
                      Add Emoji
                    </span>
                  </div>
                </div>
                <input 
                  type="text"
                  placeholder={selectedChannel ? `Message #${selectedChannel.name}...` : `Message ${selectedUser?.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none min-w-0"
                />
                <div className="relative group shrink-0">
                  <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center"
                    aria-label="Send Message"
                  >
                    <Send className="w-8 h-8" />
                  </button>
                  <span className="absolute bottom-full mb-2 right-0 px-2.5 py-1 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 ease-out translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50 shadow-md ring-1 ring-white/10">
                    Send Message
                  </span>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center">
              <MessageSquare className="w-15 h-15" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Select a conversation</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Select a team channel or member from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Team Conversation Modal */}
      <AnimatePresence>
        {showCreateChannelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">New Team Conversation</h3>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setShowCreateChannelModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-7.5 h-7.5" />
                  </button>
                  <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-all duration-200 ease-out whitespace-nowrap z-50 shadow-md">
                    Close
                  </span>
                </div>
              </div>
              <form onSubmit={handleCreateChannel} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Conversation Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                    <input
                      type="text"
                      placeholder="sprint-planning, design-critique"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full pl-7 pr-4 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-medium text-slate-800 transition-all focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Spaces will be converted to dashes (-) and uppercase letters to lowercase.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="What is this conversation about?"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm font-medium text-slate-800 transition-all focus:outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateChannelModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                  >
                    Create Channel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
