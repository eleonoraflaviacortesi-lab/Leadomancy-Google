import { useMemo } from "react";
import { useDailyData } from "./useDailyData";
import { useSedeTargets } from "./useSedeTargets";
import { startOfWeek, startOfMonth, startOfYear, isWithinInterval, subWeeks, subMonths, subYears } from "date-fns";

export function useKPIs(period: 'week' | 'month' | 'year' = 'month', isOfficeView: boolean = false) {
  const { myData, allData, isLoading: isDailyLoading } = useDailyData();
  const { targets, isLoading: isTargetsLoading } = useSedeTargets();

  const kpis = useMemo(() => {
    const sourceData = isOfficeView ? allData : myData;
    if (!sourceData.length) return null;

    const now = new Date();
    let start: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      prevEnd = new Date(start.getTime() - 1);
    } else if (period === 'year') {
      start = startOfYear(now);
      prevStart = startOfYear(subYears(now, 1));
      prevEnd = new Date(start.getTime() - 1);
    } else {
      start = startOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = new Date(start.getTime() - 1);
    }

    const currentPeriodData = sourceData.filter(r => isWithinInterval(new Date(r.date), { start, end: now }));
    const prevPeriodData = sourceData.filter(r => isWithinInterval(new Date(r.date), { start: prevStart, end: prevEnd }));

    const calculateTotals = (data: any[]) => ({
      contatti: data.reduce((acc, r) => acc + (Number(r.contatti_reali) || 0), 0),
      notizie: data.reduce((acc, r) => acc + (Number(r.notizie_reali) || 0), 0),
      clienti: data.reduce((acc, r) => acc + (Number(r.clienti_gestiti) || 0), 0),
      appuntamenti: data.reduce((acc, r) => acc + (Number(r.appuntamenti_vendita) || 0), 0),
      acquisizioni: data.reduce((acc, r) => acc + (Number(r.acquisizioni) || 0), 0),
      incarichi: data.reduce((acc, r) => acc + (Number(r.incarichi_vendita) || 0), 0),
      vendite: data.reduce((acc, r) => acc + (Number(r.vendite_numero) || 0), 0),
      fatturato: data.reduce((acc, r) => acc + (Number(r.vendite_valore) || 0), 0),
      trattativeChiuse: data.reduce((acc, r) => acc + (Number(r.trattative_chiuse) || 0), 0),
      fatturatoCredito: data.reduce((acc, r) => acc + (Number(r.fatturato_a_credito) || 0), 0),
    });

    const currentTotals = calculateTotals(currentPeriodData);
    const prevTotals = calculateTotals(prevPeriodData);

    const getKPI = (key: keyof typeof currentTotals, targetValue: number = 0) => {
      const value = currentTotals[key];
      const prevValue = prevTotals[key];
      const delta = value - prevValue;
      const percent = targetValue > 0 ? Math.round((value / targetValue) * 100) : 0;
      
      return { value, target: targetValue, delta, percent };
    };

    // Adjust targets based on period (targets are monthly)
    const targetMultiplier = period === 'week' ? 0.25 : period === 'year' ? 12 : 1;
    
    return {
      contatti: getKPI('contatti', (targets?.contatti_target || 0) * targetMultiplier),
      notizie: getKPI('notizie', (targets?.notizie_target || 0) * targetMultiplier),
      clienti: getKPI('clienti', 20 * targetMultiplier), // Arbitrary target for clienti
      appuntamenti: getKPI('appuntamenti', (targets?.appuntamenti_target || 0) * targetMultiplier),
      acquisizioni: getKPI('acquisizioni', (targets?.acquisizioni_target || 0) * targetMultiplier),
      incarichi: getKPI('incarichi', (targets?.incarichi_target || 0) * targetMultiplier),
      vendite: getKPI('vendite', (targets?.vendite_target || 0) * targetMultiplier),
      fatturato: getKPI('fatturato', (targets?.fatturato_target || 0) * targetMultiplier),
      trattativeChiuse: getKPI('trattativeChiuse', (targets?.trattative_chiuse_target || 0) * targetMultiplier),
      fatturatoCredito: getKPI('fatturatoCredito', 10000 * targetMultiplier),
    };
  }, [myData, allData, targets, period, isOfficeView]);

  return {
    kpis,
    isLoading: isDailyLoading || isTargetsLoading,
  };
}
