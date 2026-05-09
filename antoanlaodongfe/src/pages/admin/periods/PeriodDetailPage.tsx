import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Chip, Divider, Stack, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ArrowBack, Send } from '@mui/icons-material';
import dayjs from 'dayjs';

import PageHeader from '@/components/common/PageHeader';
import StatusChip from '@/components/common/StatusChip';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useExamPeriod, useSubmitPeriodForReview } from '@/hooks/useExamPeriods';
import { examTypeLabels, approvalStatusLabels, getUnifiedStatus } from '@/utils/vietnameseLabels';
import type { ApprovalStatus } from '@/types/enums';
import { departmentApi } from '@/api/departmentApi';
import { occupationApi } from '@/api/catalogApi';

export default function PeriodDetailPage() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const { data: period, isLoading } = useExamPeriod(periodId || '');
  const submitMutation = useSubmitPeriodForReview(periodId || '');

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list(),
  });
  const { data: occupations = [] } = useQuery({
    queryKey: ['occupations', 'all'],
    queryFn: () => occupationApi.list(false),
  });

  if (isLoading) return <LoadingOverlay />;
  if (!period) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Không tìm thấy kỳ thi.</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/periods')} sx={{ mt: 2 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  const appStatus = period.approval_status as ApprovalStatus;
  const uni = getUnifiedStatus(appStatus, period.start_date, period.end_date);
  const canSubmit = appStatus === 'draft' || appStatus === 'rejected';

  const deptNames = period.department_ids.length
    ? departments
        .filter((d) => period.department_ids.includes(d.id))
        .map((d) => d.name)
        .join(', ')
    : 'Tất cả phòng ban';

  const occNames = period.target_occupations.length
    ? period.target_occupations.join(', ')
    : 'Tất cả ngành nghề';

  const skillLevels = period.target_skill_levels.length
    ? period.target_skill_levels.map((lv) => `Bậc ${lv}`).join(', ')
    : 'Tất cả bậc';

  return (
    <>
      <PageHeader title="Chi tiết kỳ thi" subtitle={period.name} />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/admin/periods')}>
          Quay lại
        </Button>
        {canSubmit && (
          <Button
            variant="contained"
            startIcon={<Send />}
            color="info"
            onClick={() => submitMutation.mutate(periodId!)}
            disabled={submitMutation.isPending}
          >
            Gửi duyệt
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/admin/periods/${periodId}/edit`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip label={uni.label} color={uni.color as any} size="medium" />
                {appStatus === 'rejected' && period.reject_reason && (
                  <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5 }}>
                    Lý do từ chối: {period.reject_reason}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Loại thi</Typography>
              <Typography fontWeight={500}>{examTypeLabels[period.exam_type]}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Thời gian bắt đầu</Typography>
              <Typography fontWeight={500}>{dayjs(period.start_date).format('HH:mm DD/MM/YYYY')}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Thời gian kết thúc</Typography>
              <Typography fontWeight={500}>{dayjs(period.end_date).format('HH:mm DD/MM/YYYY')}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Phòng ban áp dụng</Typography>
              <Typography fontWeight={500}>{deptNames}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Nghề áp dụng</Typography>
              <Typography fontWeight={500}>{occNames}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">Bậc tay nghề áp dụng</Typography>
              <Typography fontWeight={500}>{skillLevels}</Typography>
            </Grid>
            {period.reviewed_by && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Người duyệt</Typography>
                <Typography fontWeight={500}>{period.reviewed_by}</Typography>
              </Grid>
            )}
            {period.approved_at && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Thời gian duyệt</Typography>
                <Typography fontWeight={500}>{dayjs(period.approved_at).format('HH:mm DD/MM/YYYY')}</Typography>
              </Grid>
            )}
          </Grid>

          {period.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">Mô tả</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{period.description}</Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Ghi chú duyệt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {period.review_notes || 'Chưa có ghi chú.'}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
