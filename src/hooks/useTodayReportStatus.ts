import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useDailyData } from '@/src/hooks/useDailyData';
import { format } from 'date-fns';

export function useTodayReportStatus() {
  const { user } = useAuth();
  const { myData } = useDailyData();
  const today = format(new Date(), 'yyyy-MM-dd');

  const hasReportedToday = useMemo(() => {
    if (!myData || !user) return false;
    return myData.some(d => d.date === today && d.user_id === user.id);
  }, [myData, today, user]);

  return { hasReportedToday };
}
