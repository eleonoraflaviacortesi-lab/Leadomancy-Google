import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageCircle, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Users, 
  Home, 
  Send,
  Filter,
  CheckCheck,
  ExternalLink,
  Info
} from "lucide-react";
import { useNotizie } from "@/src/hooks/useNotizie";
import { useClienti } from "@/src/hooks/useClienti";
import { Notizia, Cliente } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

export default function BlastPage() {
  const [step, setStep] = useState(1);
  const { notizie, isLoading: loadingNotizie } = useNotizie();
  const { clienti, isLoading: loadingClienti } = useClienti();

  // Step 1: Property Selection
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [notiziaSearch, setNotiziaSearch] = useState("");

  const filteredNotizie = useMemo(() => {
    return notizie.filter(n => {
      const search = notiziaSearch.toLowerCase();
      return (
        (n.zona || "").toLowerCase().includes(search) ||
        (n.type || "").toLowerCase().includes(search) ||
        (n.nome || "").toLowerCase().includes(search)
      );
    });
  }, [notizie, notiziaSearch]);

  // Step 2: Buyer Selection
  const [buyerSearch, setBuyerSearch] = useState("");
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [onlyCompatibleBudget, setOnlyCompatibleBudget] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBuyers = useMemo(() => {
    return clienti.filter(c => {
      const search = buyerSearch.toLowerCase();
      const matchesSearch = 
        (c.nome || "").toLowerCase().includes(search) ||
        (c.cognome || "").toLowerCase().includes(search) ||
        String(c.telefono || "").toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      
      if (onlyCompatibleBudget && selectedNotizia) {
        const prezzo = selectedNotizia.prezzo_richiesto || selectedNotizia.prezzo || 0;
        if (c.budget_max !== null && c.budget_max < prezzo) return false;
      }

      return true;
    });
  }, [clienti, buyerSearch, statusFilter, onlyCompatibleBudget, selectedNotizia]);

  const selectCompatible = () => {
    if (!selectedNotizia) return;
    const prezzo = selectedNotizia.prezzo_richiesto || selectedNotizia.prezzo || 0;
    const compatible = filteredBuyers
      .filter(c => c.budget_max === null || c.budget_max >= prezzo)
      .map(c => c.id);
    setSelectedBuyers(prev => Array.from(new Set([...prev, ...compatible])));
    toast.success(`${compatible.length} buyer compatibili selezionati`);
  };

  // Step 3: Message & Send
  const [template, setTemplate] = useState(
    "Buongiorno {nome}, sono Eleonora di Altair Luxury Real Estate. Ti contatto perché abbiamo appena acquisito una nuova proprietà in zona {zona} ({tipo}) che potrebbe interessarti. Il prezzo è di {prezzo}. Fammi sapere se vuoi maggiori informazioni!"
  );

  const compileMessage = (buyer: Cliente, property: Notizia) => {
    let msg = template;
    msg = msg.replace(/{nome}/g, buyer.nome || "");
    msg = msg.replace(/{cognome}/g, buyer.cognome || "");
    msg = msg.replace(/{zona}/g, property.zona || "");
    msg = msg.replace(/{tipo}/g, property.type || "");
    msg = msg.replace(/{prezzo}/g, (property.prezzo_richiesto || property.prezzo || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }));
    return msg;
  };

  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  const startBlast = async () => {
    if (selectedBuyers.length === 0 || !selectedNotizia) return;
    
    setIsSending(true);
    setSendingProgress(0);

    const buyersToBlast = clienti.filter(c => selectedBuyers.includes(c.id));

    for (let i = 0; i < buyersToBlast.length; i++) {
        const buyer = buyersToBlast[i];
        const message = compileMessage(buyer, selectedNotizia);
        const rawPhone = String(buyer.telefono || '');
        const phone = rawPhone.replace(/\s/g, '').replace(/\+/g, '');
        
        // Open WhatsApp
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        setSendingProgress(((i + 1) / buyersToBlast.length) * 100);
        
        // Wait 1.8 seconds
        if (i < buyersToBlast.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1800));
        }
    }

    setIsSending(false);
    setSendingProgress(100);
    toast.success("Invio a raffica completato!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] bg-[#FDFDFC]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-outfit font-bold text-[#1A1A18] tracking-tight flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
            WhatsApp Blast
          </h1>
          <p className="text-[14px] text-black/40 font-outfit mt-1">
            Invia messaggi personalizzati a raffica ai tuoi potenziali acquirenti
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-outfit font-bold text-[12px] transition-all duration-300",
                step === s ? "bg-[#1A1A18] text-white" : step > s ? "bg-[#25D366] text-white" : "bg-black/5 text-black/30"
              )}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={cn("w-12 h-[2px] rounded-full", step > s ? "bg-[#25D366]" : "bg-black/5")} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-8 relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-outfit font-bold text-[#1A1A18]">1. Scegli la proprietà</h2>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                  <input
                    type="text"
                    placeholder="Cerca per zona o tipo..."
                    value={notiziaSearch}
                    onChange={(e) => setNotiziaSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-black/10 rounded-xl font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A18]/5 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
                {filteredNotizie.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNotizia(n)}
                    className={cn(
                      "flex flex-col p-4 rounded-2xl border transition-all text-left",
                      selectedNotizia?.id === n.id 
                        ? "border-[#1A1A18] bg-[#F5F4F0] shadow-sm" 
                        : "border-black/5 bg-white hover:border-black/20 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-[20px]">
                        {n.emoji || '🏠'}
                      </div>
                      {selectedNotizia?.id === n.id && (
                        <div className="w-6 h-6 bg-[#1A1A18] rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="font-outfit font-bold text-[15px] text-[#1A1A18] line-clamp-1">{n.zona}</span>
                    <span className="font-outfit text-[13px] text-black/40 uppercase tracking-wider mb-2">{n.type}</span>
                    <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between">
                      <span className="font-outfit font-bold text-[14px]">
                        {(n.prezzo_richiesto || n.prezzo || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto flex justify-end">
                <button
                  disabled={!selectedNotizia}
                  onClick={() => setStep(2)}
                  className="h-12 px-8 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-sm tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                >
                  Continua <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xl font-outfit font-bold text-[#1A1A18]">2. Seleziona i Buyer</h2>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                    <input
                      type="text"
                      placeholder="Nome o telefono..."
                      value={buyerSearch}
                      onChange={(e) => setBuyerSearch(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 bg-white border border-black/10 rounded-xl font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A18]/5 transition-all"
                    />
                  </div>
                  <button
                    onClick={selectCompatible}
                    className="h-10 px-4 bg-[#25D366]/10 text-[#25D366] rounded-xl font-outfit font-bold text-xs uppercase tracking-wider hover:bg-[#25D366]/20 transition-all flex items-center gap-2"
                  >
                    <CheckCheck size={16} /> Seleziona compatibili
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="flex items-center gap-6 px-4 py-3 bg-[#F5F4F0] rounded-2xl shrink-0">
                <div className="flex items-center gap-2 border-r border-black/10 pr-6">
                    <span className="text-[11px] font-outfit font-bold uppercase tracking-widest text-black/40">Status:</span>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent font-outfit text-sm font-bold focus:outline-none"
                    >
                        <option value="all">Tutti</option>
                        <option value="new">Nuovo</option>
                        <option value="contacted">Contattato</option>
                        <option value="qualified">Qualificato</option>
                        <option value="proposal">Proposta</option>
                    </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={onlyCompatibleBudget}
                          onChange={(e) => setOnlyCompatibleBudget(e.target.checked)}
                          className="sr-only" 
                        />
                        <div className={cn(
                            "w-10 h-5 rounded-full transition-colors",
                            onlyCompatibleBudget ? "bg-[#1A1A18]" : "bg-black/10 group-hover:bg-black/20"
                        )} />
                        <div className={cn(
                            "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                            onlyCompatibleBudget ? "translate-x-5" : "translate-x-0"
                        )} />
                    </div>
                    <span className="text-[12px] font-outfit font-bold text-[#1A1A18]">Solo budget compatibile</span>
                </label>
                <div className="ml-auto text-[13px] font-outfit font-bold text-[#1A1A18]">
                    <span className="text-black/40 uppercase tracking-widest mr-2">Selezionati:</span>
                    <span className="bg-[#1A1A18] text-white px-3 py-1 rounded-full">{selectedBuyers.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mx-2 px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredBuyers.map(c => {
                        const isSelected = selectedBuyers.includes(c.id);
                        return (
                            <div 
                              key={c.id}
                              onClick={() => {
                                setSelectedBuyers(prev => 
                                    isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all",
                                isSelected ? "bg-[#1A1A18] border-[#1A1A18] shadow-md" : "bg-white border-black/5 hover:border-black/10 hover:shadow-sm"
                              )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                        isSelected ? "bg-white border-white" : "border-black/20"
                                    )}>
                                        {isSelected && <Check size={12} className="text-[#1A1A18]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("font-outfit font-bold text-[xs] tracking-wide mb-0.5", isSelected ? "text-white" : "text-[#1A1A18]")}>
                                            {c.nome} {c.cognome}
                                        </div>
                                        <div className={cn("text-[13px] font-outfit", isSelected ? "text-white/60" : "text-black/40")}>
                                            {c.telefono}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn("font-outfit font-bold text-[14px]", isSelected ? "text-white" : "text-[#1A1A18]")}>
                                            {(c.budget_max || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                        <div className={cn(
                                            "text-[10px] font-outfit font-bold px-2 py-0.5 rounded-full inline-block mt-1",
                                            isSelected ? "bg-white/20 text-white" : "bg-black/5 text-black/40"
                                        )}>
                                            {c.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="mt-auto flex justify-between pt-6 border-t border-black/5">
                <button
                  onClick={() => setStep(1)}
                  className="h-12 px-8 border border-black/10 rounded-full font-outfit font-bold text-sm tracking-wide hover:bg-black/5 transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={18} /> Indietro
                </button>
                <button
                  disabled={selectedBuyers.length === 0}
                  onClick={() => setStep(3)}
                  className="h-12 px-8 bg-[#1A1A18] text-white rounded-full font-outfit font-bold text-sm tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                >
                  Continua <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xl font-outfit font-bold text-[#1A1A18]">3. Messaggio & Invio</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#25D366]/10 text-[#25D366] rounded-full text-xs font-outfit font-bold">
                    <Users size={14} /> {selectedBuyers.length} Destinatari
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                {/* Editor */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-black/40 px-1">Template Messaggio</label>
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="flex-1 min-h-[200px] w-full p-6 bg-white border border-black/10 rounded-3xl font-outfit text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A18]/5 resize-none shadow-sm transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['{nome}', '{cognome}', '{zona}', '{tipo}', '{prezzo}'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setTemplate(prev => prev + ' ' + tag)}
                          className="h-9 px-3 bg-white border border-black/5 text-[12px] font-outfit font-bold text-[#1A1A18] rounded-xl hover:bg-black/5 transition-all"
                        >
                            {tag}
                        </button>
                    ))}
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl flex gap-3 text-orange-800">
                    <Info className="shrink-0 w-4 h-4 mt-0.5" />
                    <p className="text-[12px] font-outfit leading-relaxed">
                        L'invio avverrà in sequenza con un ritardo di 1.8 secondi. Dovrai cliccare "Invia" su ogni tab di WhatsApp Web che si aprirà.
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-outfit font-bold uppercase tracking-widest text-black/40 px-1">Anteprima invio</label>
                    <div className="flex-1 bg-[#E5DDD5] rounded-3xl p-6 relative overflow-hidden shadow-inner border border-black/5">
                        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
                        
                        <div className="relative z-10 flex flex-col gap-4">
                            {clienti.filter(c => selectedBuyers.includes(c.id)).slice(0, 1).map(b => (
                                <div key={b.id} className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                                    <div className="text-[14px] font-outfit text-[#1A1A18] whitespace-pre-wrap leading-relaxed">
                                        {compileMessage(b, selectedNotizia!)}
                                    </div>
                                    <div className="text-[10px] text-black/30 font-outfit mt-2 text-right">
                                        {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                            <div className="text-center">
                                <span className="bg-white/40 text-[#1A1A18]/60 px-4 py-1.5 rounded-full text-[11px] font-outfit font-bold uppercase tracking-wider backdrop-blur-sm">
                                    + altri {Math.max(0, selectedBuyers.length - 1)} messaggi simili
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-auto flex justify-between pt-6 border-t border-black/5">
                <button
                  disabled={isSending}
                  onClick={() => setStep(2)}
                  className="h-12 px-8 border border-black/10 rounded-full font-outfit font-bold text-sm tracking-wide hover:bg-black/5 transition-all flex items-center gap-2 "
                >
                  <ChevronLeft size={18} /> Indietro
                </button>
                
                <div className="flex items-center gap-4">
                    {isSending && (
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[11px] font-outfit font-bold text-black/40 uppercase tracking-widest">Invio in corso...</span>
                            <div className="w-32 h-1 bg-black/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-[#25D366]" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sendingProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    <button
                      disabled={isSending || selectedBuyers.length === 0}
                      onClick={startBlast}
                      className={cn(
                        "h-12 px-10 rounded-full font-outfit font-bold text-sm tracking-wide transition-all flex items-center gap-4 shadow-lg",
                        isSending ? "bg-black/5 text-black/20" : "bg-[#25D366] text-white hover:scale-105 active:scale-95"
                      )}
                    >
                      {isSending ? "Inviando..." : "Invia a raffica"}
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <Send size={14} className="text-white" />
                      </div>
                    </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
