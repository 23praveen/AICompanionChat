import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import ChatContainer from "@/components/chat/chat-container";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Chat } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  // Fetch chats
  const { 
    data: chats, 
    isLoading,
    isError 
  } = useQuery<Chat[]>({ 
    queryKey: ["/api/chats"],
  });

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chats", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (newChat: Chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setSelectedChatId(newChat.id);
    }
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      await apiRequest("DELETE", `/api/chats/${chatId}`);
      return chatId;
    },
    onSuccess: (deletedChatId: number) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      if (selectedChatId === deletedChatId) {
        setSelectedChatId(null);
      }
    }
  });

  // Select the first chat by default if none is selected
  useEffect(() => {
    if (!selectedChatId && chats && chats.length > 0 && !isLoading) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId, isLoading]);

  // Handle new chat creation
  const handleNewChat = () => {
    createChatMutation.mutate();
    setShowMobileSidebar(false);
  };

  // Handle chat selection
  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
    setShowMobileSidebar(false);
  };

  // Handle chat deletion
  const handleDeleteChat = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatMutation.mutate(chatId);
  };

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <Sidebar 
          username={user?.username || ""} 
          chats={chats || []}
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          isCreatingChat={createChatMutation.isPending}
          isDeletingChat={deleteChatMutation.isPending}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <button 
            className="flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h1 className="text-lg font-bold">AI Chat</h1>
          </div>
          <div className="w-6"></div> {/* Placeholder for balance */}
        </div>

        {/* Chat Container */}
        <ChatContainer 
          chatId={selectedChatId} 
          onNewChat={handleNewChat}
        />
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex justify-between">
        <button 
          className="p-2 text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
          onClick={toggleSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button 
          className="p-2 rounded-full bg-blue-500 text-white"
          onClick={handleNewChat}
          disabled={createChatMutation.isPending}
        >
          {createChatMutation.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`
          md:hidden fixed inset-y-0 left-0 w-72 bg-gray-50 dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar 
          username={user?.username || ""} 
          chats={chats || []}
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onCloseSidebar={toggleSidebar}
          isMobile={true}
          isCreatingChat={createChatMutation.isPending}
          isDeletingChat={deleteChatMutation.isPending}
        />
      </div>
    </div>
  );
}
