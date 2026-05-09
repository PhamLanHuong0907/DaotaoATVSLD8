import dayjs from 'dayjs';
import type {
  ExamType, ExamMode, QuestionType, DifficultyLevel, ApprovalStatus,
  ResultClassification, TrainingGroup, ExamPeriodStatus, ExamRoomStatus, UserRole,
} from '@/types/enums';

export const examTypeLabels: Record<ExamType, string> = {
  skill_upgrade: 'Thi nâng bậc thợ',
  periodic_atvsld: 'Thi ATVSLĐ định kỳ',
  safety_hygiene: 'Thi an toàn vệ sinh viên',
  legal_knowledge: 'Thi văn bản pháp luật',
};

export const examModeLabels: Record<ExamMode, string> = {
  online: 'Trực tuyến',
  onsite: 'Trực tiếp',
};

export const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng / Sai',
  scenario_based: 'Tình huống',
};

export const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

/** Unified approval status labels — dùng chung cho tất cả các loại */
export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  draft: 'Nháp',
  pending_dept_review: 'Chờ duyệt phòng ban',
  dept_approved: 'Đã duyệt phòng ban',
  pending_review: 'Chờ duyệt cuối',
  approved: 'Đã lên lịch',
  rejected: 'Đã từ chối',
};

export const classificationLabels: Record<ResultClassification, string> = {
  excellent: 'Giỏi',
  good: 'Khá',
  average: 'Trung bình',
  fail: 'Không đạt',
};

export const trainingGroupLabels: Record<TrainingGroup, string> = {
  atvsld: 'An toàn vệ sinh lao động',
  skill_upgrade: 'Nâng bậc thợ',
  safety_hygiene: 'An toàn vệ sinh viên',
  legal_knowledge: 'Văn bản pháp luật',
};

export const examPeriodStatusLabels: Record<ExamPeriodStatus, string> = {
  draft: 'Nháp',
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang diễn ra',
  finished: 'Đã kết thúc',
  cancelled: 'Đã huỷ',
};

export const examRoomStatusLabels: Record<ExamRoomStatus, string> = {
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang diễn ra',
  finished: 'Đã kết thúc',
  cancelled: 'Đã huỷ',
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  training_officer: 'Cán bộ đào tạo',
  manager: 'Cán bộ quản lý',
  worker: 'Người lao động',
};

/** Unified status chip color for the combined approval + time-based status */
export type StatusColor = 'default' | 'info' | 'warning' | 'success' | 'error';

/**
 * Compute the unified display status for an item with 2-level approval workflow
 * and scheduled times. Returns { label, color }.
 *
 * Flow: Nháp → Chờ duyệt PB → Đã duyệt PB → Chờ duyệt cuối → Đã lên lịch → Đang diễn ra → Đã kết thúc
 *        ↘ Đã từ chối (cho phép sửa/gửi lại)
 */
export function getUnifiedStatus(
  approvalStatus: ApprovalStatus,
  scheduledStart: string | null | undefined,
  scheduledEnd: string | null | undefined,
): { label: string; color: StatusColor } {
  // Only "approved" items can transition to time-based statuses
  if (approvalStatus === 'approved') {
    const now = dayjs();
    const start = scheduledStart ? dayjs(scheduledStart) : null;
    const end = scheduledEnd ? dayjs(scheduledEnd) : null;

    if (start && now.isBefore(start)) {
      return { label: 'Đã lên lịch', color: 'info' };
    }
    if (start && end && now.isAfter(start) && now.isBefore(end)) {
      return { label: 'Đang diễn ra', color: 'success' };
    }
    if (end && now.isAfter(end)) {
      return { label: 'Đã kết thúc', color: 'default' };
    }
    // No schedule dates yet — still approved
    return { label: 'Đã lên lịch', color: 'info' };
  }

  // Non-approved statuses use approvalStatusLabels directly
  return {
    label: approvalStatusLabels[approvalStatus] || approvalStatus,
    color:
      approvalStatus === 'draft' ? 'default' :
      approvalStatus === 'pending_dept_review' ? 'warning' :
      approvalStatus === 'dept_approved' ? 'info' :
      approvalStatus === 'pending_review' ? 'warning' :
      approvalStatus === 'rejected' ? 'error' :
      'default',
  };
}
