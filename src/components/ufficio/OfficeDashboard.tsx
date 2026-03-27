import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Briefcase,
  PhoneCall
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useKPIs } from "@/src/hooks/useKPIs";
import { useProfiles } from "@/src/hooks/useProfiles";
import { useDailyData } from "@/src/hooks/useDailyData";
import { cn, formatCurrency } from "@/src/lib/utils";

interface OfficeDashboardProps {
  period: 'week' | 'month' | 'year';
}

export const OfficeDashboard: React.FC<OfficeDashboardProps> = ({ period }) => {
  const { user } = useAuth();
  const { kpis, isLoading: isKPIsLoading } = useKPIs(period, true);
  const { profiles } = useProfiles();
  const { allData } = useDailyData();

  const officeProfiles = useMemo(() => 
    profiles.filter(p => p.sede === user?.sede),
    [profiles, user?.sede]
  );

  // Calculate agent-specific stats for the ranking table
  const agentStats = useMemo(() => {
    return officeProfiles.map(profile => {
      const agentData = allData.filter(d => d.user_id === profile.id);
      return {
        ...profile,
        contatti: agentData.reduce((sum, d) => sum + (Number(d.contatti_reali) || 0), 0),
        notizie: agentData.reduce((sum, d) => sum + (Number(d.notizie_reali) || 0), 0),
        vendite: agentData.reduce((sum, d) => sum + (Number(d.vendite_numero) || 0), 0),
        fatturato: agentData.reduce((sum, d) => sum + (Number(d.vendite_valore) || 0), 0),
      };
    }).sort((a, b) => b.fatturato - a.fatturato);
  }, [officeProfiles, allData]);

  if (isKPIsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Summary Bar - High Density */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          label="Contatti Totali" 
          value={kpis?.contatti?.value || 0} 
          delta={kpis?.contatti?.delta || 0}
          icon={<PhoneCall size={16} />}
          color="lavender"
        />
        <SummaryCard 
          label="Notizie Totali" 
          value={kpis?.notizie?.value || 0} 
          delta={kpis?.notizie?.delta || 0}
          icon={<Activity size={16} />}
          color="sage"
        />
        <SummaryCard 
          label="Vendite Sede" 
          value={kpis?.vendite?.value || 0} 
          delta={kpis?.vendite?.delta || 0}
          icon={<Briefcase size={16} />}
          color="amber"
        />
        <SummaryCard 
          label="Fatturato Sede" 
          value={kpis?.fatturato?.value || 0} 
          delta={kpis?.fatturato?.delta || 0}
          icon={<DollarSign size={16} />}
          color="rose"
          isCurrency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Ranking Table (2/3) */}
        <div className="lg:col-span-2 bg-white border border-[var(--border-light)] rounded-[20px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                <Award size={20} className="text-[var(--text-primary)]" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-[16px] text-[var(--text-primary)]">Ranking Agenti</h3>
                <p className="text-[12px] text-[var(--text-muted)]">Performance individuale nella sede</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-light)]">
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] w-12 text-center">#</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)]">Agente</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Contatti</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Notizie</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Vendite</th>
                  <th className="pb-4 font-outfit font-semibold text-[11px] uppercase text-[var(--text-muted)] text-right">Fatturato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {agentStats.map((agent, i) => (
                  <tr key={agent.id} className="group hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold mx-auto",
                        i === 0 ? "bg-[var(--amber-bg)] text-[var(--amber-fg)]" : "text-[var(--text-muted)]"
                      )}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{agent.avatar_emoji || '👤'}</span>
                        <span className="font-outfit font-medium text-[14px] text-[var(--text-primary)]">
                          {agent.full_name || `${agent.nome} ${agent.cognome}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">{agent.contatti}</td>
                    <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">{agent.notizie}</td>
                    <td className="py-4 text-right font-outfit font-medium text-[14px] text-[var(--text-primary)]">{agent.vendite}</td>
                    <td className="py-4 text-right font-outfit font-bold text-[14px] text-[var(--text-primary)]">
                      {formatCurrency(agent.fatturato)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Goals & Progress (1/3) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[var(--border-light)] rounded-[20px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                <Target size={20} className="text-[var(--text-primary)]" />
              </div>
              <h3 className="font-outfit font-bold text-[16px] text-[var(--text-primary)]">Obiettivi Sede</h3>
            </div>

            <div className="flex flex-col gap-8">
              <GoalProgress 
                label="Fatturato" 
                current={kpis?.fatturato?.value || 0} 
                target={kpis?.fatturato?.target || 0} 
                isCurrency 
              />
              <GoalProgress 
                label="Vendite" 
                current={kpis?.vendite?.value || 0} 
                target={kpis?.vendite?.target || 0} 
              />
              <GoalProgress 
                label="Acquisizioni" 
                current={kpis?.acquisizioni?.value || 0} 
                target={kpis?.acquisizioni?.target || 0} 
              />
              <GoalProgress 
                label="Incarichi" 
                current={kpis?.incarichi?.value || 0} 
                target={kpis?.incarichi?.target || 0} 
              />
            </div>
          </div>

          {/* Office Health Card */}
          <div className="bg-[var(--text-primary)] text-white rounded-[20px] p-8 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-[11px] uppercase tracking-widest opacity-60">STATO SEDE</h3>
              <Activity size={16} className="opacity-60" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[32px] font-outfit font-bold">Ottimo</span>
              <p className="text-[13px] opacity-70 leading-relaxed">
                La sede di {user?.sede} sta performando sopra la media stagionale. 
                Il tasso di conversione notizie/vendite è aumentato del 4% rispetto al mese scorso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, delta, icon, color, isCurrency }: any) => (
  <div className="bg-white border border-[var(--border-light)] rounded-[16px] p-5 shadow-sm flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        `bg-[var(--${color}-bg)] text-[var(--${color}-fg)]`
      )}>
        {icon}
      </div>
      <div className={cn(
        "flex items-center gap-0.5 text-[11px] font-bold font-outfit",
        delta >= 0 ? "text-[var(--sage-fg)]" : "text-[var(--rose-fg)]"
      )}>
        {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(delta)}
      </div>
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      <span className="text-[20px] font-outfit font-bold text-[var(--text-primary)]">
        {isCurrency ? formatCurrency(value) : value}
      </span>
    </div>
  </div>
);

const GoalProgress = ({ label, current, target, isCurrency }: any) => {
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-outfit font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-[11px] font-outfit font-bold text-[var(--text-muted)]">
          {percent}%
        </span>
      </div>
      <div className="h-2 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            percent >= 100 ? "bg-[var(--sage-fg)]" : "bg-[var(--text-primary)]"
          )}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-outfit font-bold text-[var(--text-muted)] uppercase tracking-tight">
        <span>{isCurrency ? formatCurrency(current) : current}</span>
        <span>Target: {isCurrency ? formatCurrency(target) : target}</span>
      </div>
    </div>
  );
};
