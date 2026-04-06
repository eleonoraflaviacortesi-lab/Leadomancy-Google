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
    const userId = user.user_id || user.id;
    return myData.some(d => d.date === today && String(d.user_id).toLowerCase() === String(userId).toLowerCase());
  }, [myData, today, user]);

  return { hasReportedToday };
}
