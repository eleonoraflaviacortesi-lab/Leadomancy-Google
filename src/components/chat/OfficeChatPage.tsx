import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SendHorizontal, 
  Smile, 
  AtSign, 
  MoreVertical,
  ThumbsUp,
  Heart,
  Laugh,
  Sunrise,
  Frown
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useProfiles } from "@/src/hooks/useProfiles";
import { getSheetData, appendRow, updateRow, SHEETS, findRowIndex } from "@/src/lib/googleSheets";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/src/lib/utils";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  sede: string;
  mentions: string[];
  reactions: Record<string, string[]>; // emoji -> userIds[]
  created_at: string;
  _rowIndex?: number;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

export const OfficeChatPage: React.FC = () => {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', user?.sede],
    queryFn: async () => {
      if (!user?.sede) return [];
      const allMessages = await getSheetData<ChatMessage>(SHEETS.chat_messages);
      return allMessages
        .filter(m => m.sede === user.sede)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    refetchInterval: 5000,
    enabled: !!user?.sede,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) return;
      const id = crypto.randomUUID();
      const newMessage: ChatMessage = {
        id,
        user_id: user.id,
        message: text,
        sede: user.sede,
        mentions: [], // Logic for mentions could be added
        reactions: {},
        created_at: new Date().toISOString()
      };
      await appendRow(SHEETS.chat_messages, newMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', user?.sede] });
      setInputValue("");
      setShouldAutoScroll(true);
    }
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ message, emoji }: { message: ChatMessage, emoji: string }) => {
      if (!user) return;
      const reactions = { ...message.reactions };
      const userIds = reactions[emoji] || [];
      
      if (userIds.includes(user.id)) {
        reactions[emoji] = userIds.filter(id => id !== user.id);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...userIds, user.id];
      }

      const rowIndex = await findRowIndex(SHEETS.chat_messages, message.id);
      if (rowIndex) {
        await updateRow(SHEETS.chat_messages, rowIndex, { reactions });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', user?.sede] });
    }
  });

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessageMutation.mutate(inputValue.trim());
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: Record<string, ChatMessage[]> = {};
    msgs.forEach(m => {
      const date = m.created_at.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Oggi";
    if (isYesterday(date)) return "Ieri";
    return format(date, 'd MMMM yyyy', { locale: it });
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--bg-page)]">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-6 pb-6 flex flex-col gap-6"
      >
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date} className="flex flex-col gap-4">
            <div className="flex justify-center">
              <span className="text-[10px] font-outfit font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-light)]">
                {formatDateHeader(date)}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              {msgs.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const author = profiles.find(p => p.id === msg.user_id);
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      isOwn ? "self-end items-end" : "self-start items-start"
                    )}
                  >
                    {!isOwn && (
                      <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] mb-1 ml-10">
                        {author?.full_name || author?.nome}
                      </span>
                    )}
                    
                    <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-light)] flex items-center justify-center text-[18px] shrink-0 mb-1">
                          {author?.avatar_emoji || '👤'}
                        </div>
                      )}
                      
                      <div className="group relative">
                        <div className={cn(
                          "px-4 py-2.5 text-[14px] font-outfit leading-relaxed shadow-sm",
                          isOwn 
                            ? "bg-[#1A1A18] text-white rounded-[18px] rounded-br-none" 
                            : "bg-white border border-[var(--border-light)] text-[var(--text-primary)] rounded-[18px] rounded-bl-none"
                        )}>
                          {msg.message}
                        </div>

                        {/* Reactions Row */}
                        {Object.keys(msg.reactions).length > 0 && (
                          <div className={cn(
                            "flex flex-wrap gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReactionMutation.mutate({ message: msg, emoji })}
                                className={cn(
                                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition-all",
                                  userIds.includes(user?.id || '') 
                                    ? "bg-black text-white border-black" 
                                    : "bg-white border-[var(--border-light)] text-[var(--text-primary)] hover:border-[var(--border-medium)]"
                                )}
                              >
                                <span>{emoji}</span>
                                <span className="font-bold">{userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick React Hover */}
                        <div className={cn(
                          "absolute top-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto",
                          isOwn ? "right-full mr-2" : "left-full ml-2"
                        )}>
                          <div className="bg-white border border-[var(--border-light)] rounded-full p-1 flex gap-1 shadow-xl">
                            {QUICK_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => toggleReactionMutation.mutate({ message: msg, emoji })}
                                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-subtle)] rounded-full transition-colors text-[16px]"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-[9px] font-outfit text-[var(--text-muted)] mt-1 mx-1">
                      {format(parseISO(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[var(--border-light)]">
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-3 bg-[var(--bg-subtle)] border border-[var(--border-light)] rounded-[24px] p-2 pl-4 focus-within:ring-1 focus-within:ring-black/5 transition-all">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-transparent border-0 outline-none font-outfit text-[14px] py-1"
            />
            
            <div className="flex items-center gap-1 pr-1">
              <button className="p-2 rounded-full hover:bg-[var(--border-light)] text-[var(--text-muted)] transition-colors">
                <Smile size={20} />
              </button>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all disabled:opacity-30"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Mentions Dropdown (Simplified) */}
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-[var(--border-light)] rounded-[14px] shadow-xl overflow-hidden z-50">
              {profiles.map(p => (
                <button 
                  key={p.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors text-left"
                >
                  <span className="text-lg">{p.avatar_emoji}</span>
                  <span className="font-outfit text-[13px] font-medium">{p.full_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
