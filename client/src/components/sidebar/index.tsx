import { useAuth } from "@/hooks/use-auth";
import { Chat } from "@shared/schema";
import { MessageSquare, Plus, LogOut, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  username: string;
  chats: Chat[];
  selectedChatId: number | null;
  onNewChat: () => void;
  onSelectChat: (chatId: number) => void;
  onDeleteChat: (chatId: number, e: React.MouseEvent) => void;
  onCloseSidebar?: () => void;
  isMobile?: boolean;
  isCreatingChat: boolean;
  isDeletingChat: boolean;
}

export default function Sidebar({ 
  username, 
  chats, 
  selectedChatId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onCloseSidebar,
  isMobile = false,
  isCreatingChat,
  isDeletingChat
}: SidebarProps) {
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h1 className="text-xl font-bold">AI Chat</h1>
        </div>
        {isMobile && (
          <button 
            className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300" 
            onClick={onCloseSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">{username}</p>
          </div>
        </div>
      </div>
      
      {/* New Chat Button */}
      <div className="p-4">
        <Button
          className="w-full flex items-center justify-center"
          onClick={onNewChat}
          disabled={isCreatingChat}
        >
          {isCreatingChat ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              New Chat
            </>
          )}
        </Button>
      </div>
      
      {/* Chat History */}
      <div className="p-2 flex-1 overflow-y-auto scrollbar-hide">
        <h2 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Chats</h2>
        {chats.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No chats yet. Click "New Chat" to start.
          </div>
        ) : (
          chats.map((chat) => (
            <button 
              key={chat.id}
              className={`w-full text-left p-2 rounded-lg transition group ${
                selectedChatId === chat.id 
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-50" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <MessageSquare className="h-5 w-5 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <button 
                    className={`ml-2 ${
                      selectedChatId === chat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } text-slate-400 hover:text-slate-500 dark:hover:text-slate-300`}
                    onClick={(e) => onDeleteChat(chat.id, e)}
                    disabled={isDeletingChat}
                  >
                    {isDeletingChat && selectedChatId === chat.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
