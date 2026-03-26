import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  LineChart, Line, Legend
} from "recharts";
import { Notizia } from "@/src/types";
import { NOTIZIA_STATUSES, NOTIZIA_STATUS_LABELS, NOTIZIA_STATUS_COLORS, TIPO_OPTIONS } from "./notizieConfig";
import { cn } from "@/src/lib/utils";
import { format, subMonths, startOfMonth, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";

interface NotizieStatsChartProps {
  isOpen: boolean;
  onClose: () => void;
  notizie: Notizia[];
}

export const NotizieStatsChart: React.FC<NotizieStatsChartProps> = ({ isOpen, onClose, notizie }) => {
  const statusData = useMemo(() => {
    return NOTIZIA_STATUSES.map(status => ({
      name: NOTIZIA_STATUS_LABELS[status],
      count: notizie.filter(n => n.status === status).length,
      color: NOTIZIA_STATUS_COLORS[status]
    }));
  }, [notizie]);

  const tipoData = useMemo(() => {
    return TIPO_OPTIONS.map(tipo => ({
      name: tipo,
      value: notizie.filter(n => n.type === tipo).length
    })).filter(d => d.value > 0);
  }, [notizie]);

  const trendData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, "MMM", { locale: it }),
        fullDate: startOfMonth(date),
        count: 0
      };
    });

    notizie.forEach(n => {
      const createdDate = new Date(n.created_at);
      const monthIndex = last6Months.findIndex(m => 
        createdDate.getMonth() === m.fullDate.getMonth() && 
        createdDate.getFullYear() === m.fullDate.getFullYear()
      );
      if (monthIndex !== -1) {
        last6Months[monthIndex].count++;
      }
    });

    return last6Months;
  }, [notizie]);

  const COLORS = ['#1A1A18', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-[16px] p-6 w-[min(90vw,800px)] max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="font-outfit font-semibold text-[20px] text-[var(--text-primary)]">Statistiche Notizie</h2>
                <p className="text-[12px] text-[var(--text-muted)] font-outfit uppercase tracking-wider">Panoramica performance</p>
              </div>
            </div>

            <div className="space-y-10">
              {/* Status Distribution */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <BarChart3 size={16} className="text-[var(--text-muted)]" />
                  <h3 className="font-outfit font-bold text-[14px] uppercase tracking-tight">Distribuzione per Stato</h3>
                </div>
                <div className="w-full bg-[var(--bg-subtle)] rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontFamily: 'Outfit' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontFamily: 'Outfit' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tipo Distribution */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <PieChartIcon size={16} className="text-[var(--text-muted)]" />
                    <h3 className="font-outfit font-bold text-[14px] uppercase tracking-tight">Notizie per Tipologia</h3>
                  </div>
                  <div className="w-full bg-[var(--bg-subtle)] rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={tipoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {tipoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          align="center"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '10px', fontFamily: 'Outfit', paddingTop: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <TrendingUp size={16} className="text-[var(--text-muted)]" />
                    <h3 className="font-outfit font-bold text-[14px] uppercase tracking-tight">Trend Acquisizioni</h3>
                  </div>
                  <div className="w-full bg-[var(--bg-subtle)] rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontFamily: 'Outfit' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontFamily: 'Outfit' }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Outfit' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#1A1A18" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#1A1A18', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[var(--bg-subtle)] rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-wider">Totale Notizie</span>
                    <span className="text-[24px] font-outfit font-bold text-[var(--text-primary)]">{notizie.length}</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2.5 bg-black text-white rounded-full font-outfit font-bold text-[13px] hover:bg-black/80 transition-all"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
