import { useState } from 'react';
import {
  Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Typography, Pagination,
  IconButton, Tooltip, Chip, Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Send } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { CheckCircleOutline, CancelOutlined } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useExamPeriods, useDeleteExamPeriod, useSubmitPeriodForReview } from '@/hooks/useExamPeriods';
import type { ExamType, ApprovalStatus } from '@/types/enums';
import { examTypeLabels, approvalStatusLabels, getUnifiedStatus, type StatusColor } from '@/utils/vietnameseLabels';
import { examPeriodApi } from '@/api/examPeriodApi';

const typeOptions = [{ value: '', label: 'Tất cả' }, ...Object.entries(examTypeLabels).map(([v, l]) => ({ value: v, label: l }))];

const unifiedStatusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Nháp', label: 'Nháp' },
  { value: 'Chờ duyệt phòng ban', label: 'Chờ duyệt phòng ban' },
  { value: 'Đã duyệt phòng ban', label: 'Đã duyệt phòng ban' },
  { value: 'Chờ duyệt cuối', label: 'Chờ duyệt cuối' },
  { value: 'Đã lên lịch', label: 'Đã lên lịch' },
  { value: 'Đang diễn ra', label: 'Đang diễn ra' },
  { value: 'Đã kết thúc', label: 'Đã kết thúc' },
  { value: 'Đã từ chối', label: 'Đã từ chối' },
];

export default function PeriodListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [examType, setExamType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;
  const [reviewModal, setReviewModal] = useState<{ open: boolean, id: string | null, type: 'approve' | 'reject' }>({ open: false, id: null, type: 'approve' });
  const [rejectReason, setRejectReason] = useState('');

  const qc = useQueryClient();
  const { data, isLoading } = useExamPeriods({
    exam_type: (examType || undefined) as ExamType | undefined,
    page, page_size: pageSize,
  });
  const deleteMutation = useDeleteExamPeriod();
  const submitReviewMutation = useSubmitPeriodForReview('');

  const handleSubmitForReview = async (id: string) => {
    try {
      submitReviewMutation.mutate(id);
      enqueueSnackbar('Đã gửi duyệt kỳ thi', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    }
  };
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => examPeriodApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-periods'] });
      enqueueSnackbar('Đã cập nhật trạng thái', { variant: 'success' });
      setReviewModal({ open: false, id: null, type: 'approve' });
      setRejectReason('');
    },
    onError: (e: Error) => enqueueSnackbar(e.message, { variant: 'error' })
  });

  /** Compute unified status for ExamPeriod using approval_status + time */
  const getPeriodStatus = (period: any): { label: string; color: StatusColor } => {
    const appStatus = period.approval_status as ApprovalStatus;
    return getUnifiedStatus(appStatus, period.start_date, period.end_date);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      enqueueSnackbar('Đã xoá kỳ thi', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    }
    setDeleteId(null);
  };

  return (
    <>
      <PageHeader
        title="Quản lý kỳ thi"
        subtitle="Tạo và quản lý các đợt thi tập trung"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/periods/create')}>
            Tạo kỳ thi
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField select size="small" label="Loại thi" value={examType}
          onChange={(e) => { setExamType(e.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}>
          {typeOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Trạng thái" value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          sx={{ minWidth: 180 }}>
          {unifiedStatusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Stack>

      {isLoading ? (
        <Paper variant="outlined">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ px: 2, py: 1.5 }}><Skeleton variant="text" width="80%" /></Box>
          ))}
        </Paper>
      ) : !data?.items.length ? (
        <EmptyState
          message="Chưa có kỳ thi nào"
          action={<Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => navigate('/admin/periods/create')}>Tạo kỳ thi đầu tiên</Button>}
        />
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tên kỳ thi</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Từ ngày</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Đến ngày</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Phòng ban</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((p) => {
                  const uni = getPeriodStatus(p);
                  const isBeforeStart = dayjs().isBefore(dayjs(p.start_date));
                  const appStatus = p.approval_status as ApprovalStatus;

                  // Client-side status filter
                  if (status && uni.label !== status) return null;

                  // Edit allowed only when draft or rejected
                  const canEdit = appStatus === 'draft' || appStatus === 'rejected';
                  // Delete allowed only when draft or rejected (not pending_review or approved)
                  const canDelete = appStatus === 'draft' || appStatus === 'rejected';
                  // Submit for review: only when draft or rejected
                  const canSubmit = appStatus === 'draft' || appStatus === 'rejected';
                  // Approve/reject when at any pending stage and before start time
                  const canApprove = (appStatus === 'pending_dept_review' || appStatus === 'dept_approved' || appStatus === 'pending_review') && isBeforeStart;

                  return (
                    <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                      <TableCell>{examTypeLabels[p.exam_type]}</TableCell>
                      <TableCell>{dayjs(p.start_date).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell>{dayjs(p.end_date).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell align="center">{p.department_ids.length || 'Tất cả'}</TableCell>

                      <TableCell align="center">
                        <Chip size="small" label={uni.label} color={uni.color} />
                        {(appStatus === 'rejected' || p.status === 'cancelled') && p.reject_reason && (
                          <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5 }}>
                            Lý do: {p.reject_reason}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {canSubmit && (
                          <Tooltip title="Gửi duyệt">
                            <IconButton size="small" color="info" onClick={() => handleSubmitForReview(p.id)}>
                              <Send fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/admin/periods/${p.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {canEdit && (
                          <Tooltip title="Sửa">
                            <IconButton size="small" onClick={() => navigate(`/admin/periods/${p.id}/edit`)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Phòng thi">
                          <IconButton size="small" onClick={() => navigate(`/admin/rooms?period_id=${p.id}`)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={canDelete ? 'Xoá' : 'Không thể xoá'}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!canDelete}
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {canApprove && (
                          <>
                            <Tooltip title="Duyệt">
                              <IconButton size="small" color="success" onClick={() => setReviewModal({ open: true, id: p.id, type: 'approve' })}>
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                              <IconButton size="small" color="warning" onClick={() => setReviewModal({ open: true, id: p.id, type: 'reject' })}>
                                <CancelOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {data.total_pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={data.total_pages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Box>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Xoá kỳ thi"
        message="Bạn có chắc chắn muốn xoá kỳ thi này? Không thể xoá nếu còn phòng thi bên trong."
        confirmText="Xoá"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      <Dialog open={reviewModal.open} onClose={() => setReviewModal({ ...reviewModal, open: false })} fullWidth maxWidth="sm">
        <DialogTitle>
          {reviewModal.type === 'approve' ? 'Xác nhận duyệt kỳ thi' : 'Từ chối kỳ thi'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {reviewModal.type === 'approve'
              ? 'Kỳ thi sau khi duyệt sẽ chuyển sang trạng thái "Đã lên lịch" và tự động kích hoạt khi đến thời gian.'
              : 'Vui lòng nhập lý do từ chối (bắt buộc):'}
          </Typography>

          {reviewModal.type === 'reject' && (
            <TextField
              fullWidth multiline rows={3}
              placeholder="Nhập lý do..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewModal({ ...reviewModal, open: false })}>Hủy</Button>
          <Button
            variant="contained"
            color={reviewModal.type === 'approve' ? 'success' : 'error'}
            disabled={reviewModal.type === 'reject' && !rejectReason.trim()}
            onClick={() => {
              if (!reviewModal.id) return;

              // Setup payload — set approval_status
              const payload = reviewModal.type === 'approve'
                ? { approval_status: 'approved' as ApprovalStatus, status: 'scheduled' }
                : { approval_status: 'rejected' as ApprovalStatus, status: 'cancelled', reject_reason: rejectReason };

              updateStatusMutation.mutate({ id: reviewModal.id, payload });
            }}
          >
            {reviewModal.type === 'approve' ? 'Duyệt' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
