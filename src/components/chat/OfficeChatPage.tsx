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
  Frown,
  Plus,
  Mic
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useProfiles } from "@/src/hooks/useProfiles";
import { useClienti } from "@/src/hooks/useClienti";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useDetail } from "@/src/context/DetailContext";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { getSheetData, appendRow, updateRow, SHEETS, findRowIndex } from "@/src/lib/googleSheets";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  sede: string;
  mentions: string[]; // userIds
  attachments: { type: 'notizia' | 'cliente' | 'file' | 'audio', id: string, url?: string, name?: string }[];
  reactions: Record<string, string[]>; // emoji -> userIds[]
  created_at: string;
  _rowIndex?: number;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

export const OfficeChatPage: React.FC = () => {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { openDetail } = useDetail();
  const queryClient = useQueryClient();
  const [isCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [inputValue, setInputValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [attachmentQuery, setAttachmentQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Impossibile accedere al microfono");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(files)]);
      toast.success(`${files.length} file selezionati`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(files)]);
      toast.success(`${files.length} file rilasciati`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        toast.success("Audio registrato! Premi invio per inviare.");
      };
    }
  };

  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', user?.sede],
    queryFn: async () => {
      if (!user?.sede) return [];
      const allMessages = await getSheetData<ChatMessage>(SHEETS.chat_messages);
      return allMessages
        .filter(m => m.sede === user.sede)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    enabled: !!user?.sede,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) return;
      
      const mentions = profiles
        .filter(p => text.includes(`@${p.full_name}`))
        .map(p => p.id);
        
      const attachments: { type: 'notizia' | 'cliente' | 'file' | 'audio', id: string, url?: string, name?: string }[] = [];
      notizie.forEach(n => {
        if (text.includes(`#${n.name}`)) attachments.push({ type: 'notizia', id: n.id });
      });
      clienti.forEach(c => {
        if (text.includes(`#${c.nome} ${c.cognome}`)) attachments.push({ type: 'cliente', id: c.id });
      });
      
      // Add manual attachments
      pendingFiles.forEach(f => {
        attachments.push({ type: 'file', id: crypto.randomUUID(), name: f.name });
      });
      
      if (audioBlob) {
        attachments.push({ type: 'audio', id: crypto.randomUUID(), name: 'audio.webm' });
      }

      const id = crypto.randomUUID();
      const newMessage: ChatMessage = {
        id,
        user_id: user.id,
        message: text,
        sede: user.sede,
        mentions,
        attachments,
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

  useEffect(() => {
    if (user && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.mentions.includes(user.id) && lastMessage.user_id !== user.id) {
        const author = profiles.find(p => p.id === lastMessage.user_id);
        toast.info(`Sei stato menzionato da ${author?.full_name || 'un collega'}`);
      }
    }
  }, [messages, user, profiles]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const handleSend = async () => {
    if (!inputValue.trim() && pendingFiles.length === 0 && !audioBlob) return;
    
    const attachments: { type: 'notizia' | 'cliente' | 'file' | 'audio', id: string, url?: string, name?: string }[] = [];
    
    // Existing attachment logic
    notizie.forEach(n => {
      if (inputValue.includes(`#${n.name}`)) attachments.push({ type: 'notizia', id: n.id });
    });
    clienti.forEach(c => {
      if (inputValue.includes(`#${c.nome} ${c.cognome}`)) attachments.push({ type: 'cliente', id: c.id });
    });
    
    // New attachment logic
    pendingFiles.forEach(f => {
      attachments.push({ type: 'file', id: crypto.randomUUID(), name: f.name });
    });
    
    if (audioBlob) {
      attachments.push({ type: 'audio', id: crypto.randomUUID(), name: 'audio.webm' });
    }
    
    await sendMessageMutation.mutateAsync(inputValue.trim());
    setPendingFiles([]);
    setAudioBlob(null);
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
    <div className="flex flex-col h-full md:h-[calc(100vh-90px)] px-4 sm:px-0" onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Header Section */}
      <div className="flex flex-col mb-4">
        <p className="text-[10px] sm:text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-1 mt-4 sm:mt-6">
          ALTAIR / Chat
        </p>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-0">
          Chat di Sede {user?.sede ? `- ${user.sede}` : ''}
        </h1>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 pb-24"
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
                      "flex flex-col max-w-[85%] sm:max-w-[75%]",
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
                          {msg.attachments?.map(a => {
                            if (a.type === 'notizia') {
                              const notizia = notizie.find(n => n.id === a.id);
                              return notizia ? (
                                <button key={a.id} onClick={() => openDetail('notizia', a.id)} className="block mt-2 p-2 bg-white/10 rounded-lg text-left hover:bg-white/20 transition-colors">
                                  <p className="font-bold text-sm">{notizia.name}</p>
                                  <p className="text-xs opacity-70">{notizia.zona}</p>
                                </button>
                              ) : null;
                            } else {
                              const cliente = clienti.find(c => c.id === a.id);
                              return cliente ? (
                                <button key={a.id} onClick={() => openDetail('cliente', a.id)} className="block mt-2 p-2 bg-white/10 rounded-lg text-left hover:bg-white/20 transition-colors">
                                  <p className="font-bold text-sm">{cliente.nome} {cliente.cognome}</p>
                                  <p className="text-xs opacity-70">{cliente.zona} - {cliente.budget}</p>
                                </button>
                              ) : null;
                            }
                          })}
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
      <div className={cn(
        "bg-white border-t border-[var(--border-light)] fixed bottom-0 left-0 w-full z-40 p-4 transition-all duration-200 ease-in-out",
        isCollapsed ? "md:pl-[52px]" : "md:pl-[220px]"
      )}>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
        
        {/* Preview Area */}
        {(pendingFiles.length > 0 || audioBlob) && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="bg-[var(--bg-subtle)] px-3 py-1 rounded-full text-[12px] flex items-center gap-2">
                <span>{file.name}</span>
                <button onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}><Plus size={12} className="rotate-45" /></button>
              </div>
            ))}
            {audioBlob && (
              <div className="bg-[var(--bg-subtle)] px-3 py-1 rounded-full text-[12px] flex items-center gap-2">
                <span>Audio registrato</span>
                <button onClick={() => setAudioBlob(null)}><Plus size={12} className="rotate-45" /></button>
              </div>
            )}
          </div>
        )}

        <div className="relative w-full max-w-7xl mx-auto border border-[var(--border-light)] rounded-full bg-white">
          <div className="flex items-center gap-2 md:gap-3 bg-[var(--bg-subtle)] px-4 py-2 rounded-full focus-within:ring-1 focus-within:ring-black/5 transition-all">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value;
                setInputValue(value);
                
                const lastWord = value.split(' ').pop() || '';
                
                if (lastWord.startsWith('@')) {
                  setShowMentions(true);
                  setMentionQuery(lastWord.slice(1));
                  setShowAttachments(false);
                } else if (lastWord.startsWith('#')) {
                  setShowAttachments(true);
                  setAttachmentQuery(lastWord.slice(1));
                  setShowMentions(false);
                } else {
                  setShowMentions(false);
                  setShowAttachments(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-transparent border-0 outline-none font-outfit text-[14px] py-1 px-2 min-w-0"
            />
            
            <div className="flex items-center gap-1 pr-2 shrink-0">
              <button 
                className="p-2 rounded-full hover:bg-[var(--border-light)] text-[var(--text-muted)] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-[var(--border-light)] text-[var(--text-muted)] transition-colors hidden sm:block">
                <Smile size={20} />
              </button>
              <button 
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isRecording ? "bg-red-100 text-red-600" : "hover:bg-[var(--border-light)] text-[var(--text-muted)]"
                )}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic size={20} />
              </button>
              <button 
                onClick={handleSend}
                disabled={(!inputValue.trim() && pendingFiles.length === 0 && !audioBlob) || sendMessageMutation.isPending}
                className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all disabled:opacity-30"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Mentions Dropdown */}
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-[var(--border-light)] rounded-[14px] shadow-xl overflow-hidden z-50">
              {profiles
                .filter(p => p.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()))
                .map(p => (
                  <button 
                    key={p.id}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors text-left"
                    onClick={() => {
                      const words = inputValue.split(' ');
                      words.pop();
                      setInputValue([...words, `@${p.full_name} `].join(' '));
                      setShowMentions(false);
                    }}
                  >
                    <span className="text-lg">{p.avatar_emoji}</span>
                    <span className="font-outfit text-[13px] font-medium">{p.full_name}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Attachments Dropdown */}
          {showAttachments && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-[var(--border-light)] rounded-[14px] shadow-xl overflow-hidden z-50">
              {notizie
                .filter(n => n.name?.toLowerCase().includes(attachmentQuery.toLowerCase()))
                .map(n => (
                  <button 
                    key={n.id}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors text-left"
                    onClick={() => {
                      const words = inputValue.split(' ');
                      words.pop();
                      setInputValue([...words, `#${n.name} `].join(' '));
                      setShowAttachments(false);
                    }}
                  >
                    <span className="text-lg">🏠</span>
                    <span className="font-outfit text-[13px] font-medium">{n.name}</span>
                  </button>
                ))}
              {clienti
                .filter(c => c.nome?.toLowerCase().includes(attachmentQuery.toLowerCase()) || c.cognome?.toLowerCase().includes(attachmentQuery.toLowerCase()))
                .map(c => (
                  <button 
                    key={c.id}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors text-left"
                    onClick={() => {
                      const words = inputValue.split(' ');
                      words.pop();
                      setInputValue([...words, `#${c.nome} ${c.cognome} `].join(' '));
                      setShowAttachments(false);
                    }}
                  >
                    <span className="text-lg">👤</span>
                    <span className="font-outfit text-[13px] font-medium">{c.nome} {c.cognome}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
