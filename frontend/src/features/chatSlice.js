import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    activeChats: [],        // List of partners and last messages
    currentRoomId: '',      // Active conversation room ID
    messages: [],           // Loaded messages list for current room
    chatPartner: null,      // Active partner details
    unreadCount: 0,
    loading: false,
    error: null
  },
  reducers: {
    chatStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setActiveChats: (state, action) => {
      state.loading = false;
      state.activeChats = action.payload;
      state.unreadCount = action.payload.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
    },
    setCurrentRoom: (state, action) => {
      state.currentRoomId = action.payload.roomId;
      state.chatPartner = action.payload.partner;
    },
    upsertActiveChat: (state, action) => {
      const existingIndex = state.activeChats.findIndex(c => c.chatRoomId === action.payload.chatRoomId);
      if (existingIndex === -1) {
        state.activeChats.unshift(action.payload);
      } else {
        state.activeChats[existingIndex] = {
          ...state.activeChats[existingIndex],
          ...action.payload
        };
      }
    },
    setMessages: (state, action) => {
      state.loading = false;
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      if (state.messages.some(message => message._id === action.payload._id)) return;

      state.messages.push(action.payload);
      
      // Update last message in activeChats list
      const chatIndex = state.activeChats.findIndex(c => c.chatRoomId === action.payload.chatRoomId);
      if (chatIndex !== -1) {
        state.activeChats[chatIndex].lastMessage = {
          content: action.payload.content,
          fileType: action.payload.fileType,
          isSeen: action.payload.isSeen,
          sender: action.payload.sender._id || action.payload.sender,
          createdAt: action.payload.createdAt
        };
        // Re-sort chats list
        state.activeChats.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
      }
    },
    updateMessage: (state, action) => {
      const messageIndex = state.messages.findIndex(message => message._id === action.payload._id);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = action.payload;
      }

      const chatIndex = state.activeChats.findIndex(c => c.chatRoomId === action.payload.chatRoomId);
      if (chatIndex !== -1) {
        state.activeChats[chatIndex].lastMessage = {
          content: action.payload.deletedAt ? 'This message was deleted' : action.payload.content,
          fileType: action.payload.fileType,
          isSeen: action.payload.isSeen,
          sender: action.payload.sender._id || action.payload.sender,
          createdAt: action.payload.createdAt
        };
      }
    },
    removeMessageForMe: (state, action) => {
      state.messages = state.messages.filter(message => message._id !== action.payload.messageId);
    },
    chatFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearChatState: (state) => {
      state.activeChats = [];
      state.currentRoomId = '';
      state.messages = [];
      state.chatPartner = null;
      state.unreadCount = 0;
    }
  }
});

export const {
  chatStart,
  setActiveChats,
  setCurrentRoom,
  upsertActiveChat,
  setMessages,
  addMessage,
  updateMessage,
  removeMessageForMe,
  chatFailure,
  clearChatState
} = chatSlice.actions;

export default chatSlice.reducer;
