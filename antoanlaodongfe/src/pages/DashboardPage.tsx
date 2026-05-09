import { useQuery } from '@tanstack/react-query';

import { Box, Alert, Skeleton, Stack } from '@mui/material';
import ExpiringCertsCard from '@/components/common/ExpiringCertsCard';
import { reportApi } from '@/api/reportApi';
import GeneralOverview from '@/components/dashboard/GeneralOverview';
import ExamOverview from '@/components/dashboard/ExamOverview';
import CourseOverview from '@/components/dashboard/CourseOverview';
import WorkerOverview from '@/components/dashboard/WorkerOverview';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/enums';

export default function DashboardPage() {
  const { user } = useAuth();
  const isWorker = user?.role === UserRole.WORKER;

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-extended'],
    queryFn: () => reportApi.dashboardExtended(),
    enabled: !isWorker,
  });

  if (isWorker) {
    return <WorkerOverview />;
  }

  if (error) return <Alert severity="error">Không thể tải dữ liệu dashboard</Alert>;

  return (
    <Stack spacing={3}>
      {isLoading || !data ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={160} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      ) : (
        <>
          <GeneralOverview data={data} />
          <Box sx={{ height: 1, bgcolor: 'divider' }} />
          <ExamOverview data={data} />
          <Box sx={{ height: 1, bgcolor: 'divider' }} />
          <CourseOverview data={data} />
          <Box>
            <ExpiringCertsCard />
          </Box>
        </>
      )}
    </Stack>
  );
}
