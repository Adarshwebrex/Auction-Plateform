import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import io from 'socket.io-client';

export default function EnhancedChat({ auctionId, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [readReceipts, setReadReceipts] = useState(new Map());
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => cleanupChat();
  }, [auctionId, userId]);

  const initializeChat = () => {
    socketRef.current = io('http://localhost:4000');
    
    // Connection events
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-auction-chat', { auctionId, userId, userName });
      toast.success('Connected to auction chat');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from chat');
    });

    // Message events
    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp),
        read: false
      }]);
      
      // Mark as read after a delay
      setTimeout(() => {
        markMessageAsRead(message.id);
      }, 2000);
    });

    socketRef.current.on('message-edited', (editedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === editedMessage.id 
          ? { ...msg, ...editedMessage, edited: true }
          : msg
      ));
    });

    socketRef.current.on('message-deleted', (messageId) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, deleted: true, content: 'This message was deleted' }
          : msg
      ));
    });

    // Typing events
    socketRef.current.on('user-typing', ({ userId: typingUserId, userName }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => new Set(prev).add(typingUserId));
        
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(typingUserId);
            return newSet;
          });
        }, 3000);
      }
    });

    // Online users events
    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(new Set(users.map(u => u.id)));
    });

    socketRef.current.on('user-joined', ({ userId: joinedUserId, userName: joinedUserName }) => {
      setOnlineUsers(prev => new Set(prev).add(joinedUserId));
      
      // System message for user join
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `${joinedUserName} joined the chat`,
        timestamp: new Date()
      }]);
    });

    socketRef.current.on('user-left', ({ userId: leftUserId, userName: leftUserName }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(leftUserId);
        return newSet;
      });
      
      // System message for user leave
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `${leftUserName} left the chat`,
        timestamp: new Date()
      }]);
    });

    // Read receipts
    socketRef.current.on('message-read', ({ messageId, userId: readerId }) => {
      setReadReceipts(prev => {
        const newMap = new Map(prev);
        if (!newMap.has(messageId)) {
          newMap.set(messageId, new Set());
        }
        newMap.get(messageId).add(readerId);
        return newMap;
      });
    });
  };

  const cleanupChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-auction-chat', { auctionId, userId });
      socketRef.current.disconnect();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const markMessageAsRead = (messageId) => {
    socketRef.current.emit('mark-message-read', { messageId, auctionId, userId });
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { auctionId, userId, userName });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('stop-typing', { auctionId, userId });
      }, 3000);
    }
  }, [isTyping, auctionId, userId, userName]);

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      auctionId,
      userId,
      userName,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'user',
      replyTo: replyTo?.id
    };

    socketRef.current.emit('send-message', messageData);
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setReplyTo(null);
    setIsTyping(false);
    
    // Focus back to input
    inputRef.current?.focus();
  };

  const editMessage = (messageId, newContent) => {
    if (!newContent.trim()) return;
    
    socketRef.current.emit('edit-message', {
      messageId,
      auctionId,
      userId,
      content: newContent.trim()
    });
    
    setEditingMessage(null);
  };

  const deleteMessage = (messageId) => {
    socketRef.current.emit('delete-message', { messageId, auctionId, userId });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (timestamp) => {
    return format(timestamp, 'HH:mm');
  };

  const getMessageReadCount = (messageId) => {
    return readReceipts.get(messageId)?.size || 0;
  };

  return (
    <div className="bg-white/5 rounded-lg overflow-hidden flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="bg-white/10 p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected && (
                <motion.div
                  className="absolute inset-0 w-3 h-3 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">Auction Chat</h3>
              <p className="text-white/60 text-sm">
                {onlineUsers.size} online
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-white/60 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.userId === userId ? 'order-2' : 'order-1'}`}>
                {message.type === 'system' ? (
                  <div className="text-center">
                    <span className="text-white/40 text-sm bg-white/5 px-3 py-1 rounded-full">
                      {message.content}
                    </span>
                  </div>
                ) : (
                  <div className={`relative group ${message.userId === userId ? 'text-right' : 'text-left'}`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="text-xs text-white/40 mb-1">
                        Replying to {messages.find(m => m.id === message.replyTo)?.userName}
                      </div>
                    )}
                    
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      message.userId === userId
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white'
                    } ${message.deleted ? 'opacity-50' : ''}`}>
                      
                      {/* Message content */}
                      {editingMessage?.id === message.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            defaultValue={message.content}
                            className="bg-white/20 rounded px-2 py-1 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                editMessage(message.id, e.target.value);
                              } else if (e.key === 'Escape') {
                                setEditingMessage(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="text-white/60 hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm">{message.content}</p>
                          {message.edited && (
                            <span className="text-xs opacity-70">(edited)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Message metadata */}
                    <div className={`text-xs text-white/40 mt-1 ${message.userId === userId ? 'text-right' : 'text-left'}`}>
                      <span>{message.userName}</span>
                      <span className="mx-1">·</span>
                      <span>{formatMessageTime(message.timestamp)}</span>
                      {message.userId === userId && (
                        <>
                          <span className="mx-1">·</span>
                          <span>{getMessageReadCount(message.id)} read</span>
                        </>
                      )}
                    </div>
                    
                    {/* Message actions */}
                    {message.userId === userId && !message.deleted && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 -mr-8">
                        <button
                          onClick={() => setEditingMessage(message)}
                          className="p-1 bg-white/10 rounded text-white/60 hover:text-white"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-1 bg-white/10 rounded text-white/60 hover:text-red-400"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-white/60 text-sm"
          >
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white/40 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Infinity,
                    delay: i * 0.1,
                    duration: 0.6
                  }}
                />
              ))}
            </div>
            <span>
              {Array.from(typingUsers).map(userId => 
                onlineUsers.has(userId) ? 'Someone' : 'User'
              ).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="bg-white/10 p-2 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              Replying to {replyTo.userName}: {replyTo.content}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-white/40 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white/10 p-4 border-t border-white/20">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {!isConnected && (
          <div className="text-center text-red-400 text-sm mt-2">
            Connection lost. Reconnecting...
          </div>
        )}
      </div>
    </div>
  );
}
