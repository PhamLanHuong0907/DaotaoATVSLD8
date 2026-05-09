import apiClient from './client';
import type { ApprovalStatus } from '@/types/enums';

export type PendingType = 'document' | 'course' | 'exam_template' | 'question' | 'exam_room' | 'exam' | 'exam_period';

export interface PendingItem {
  id: string;
  type: PendingType;
  title: string;
  created_by: string;
  created_at: string;
  approval_status: ApprovalStatus;
  occupation: string | null;
  skill_level: number | null;
}

export interface ApprovalSummary {
  total: number;
  dept_pending: number;
  review_pending: number;
  by_type: Record<string, number>;
  items: PendingItem[];
}

export const approvalApi = {
  inbox: (type?: PendingType) =>
    apiClient
      .get<ApprovalSummary>('/approvals/inbox', { params: type ? { type } : {} })
      .then((r) => r.data),

  // Level 1: Department approval
  deptApprove: (type: PendingType, id: string, reviewNotes?: string) =>
    apiClient
      .post(`/approvals/${type}/${id}/dept-approve`, { review_notes: reviewNotes })
      .then((r) => r.data),

  deptReject: (type: PendingType, id: string, reviewNotes?: string) =>
    apiClient
      .post(`/approvals/${type}/${id}/dept-reject`, { review_notes: reviewNotes })
      .then((r) => r.data),

  // Level 2: Specific reviewer approval
  approve: (type: PendingType, id: string, reviewNotes?: string) =>
    apiClient
      .post(`/approvals/${type}/${id}/approve`, { review_notes: reviewNotes })
      .then((r) => r.data),

  reject: (type: PendingType, id: string, reviewNotes?: string) =>
    apiClient
      .post(`/approvals/${type}/${id}/reject`, { review_notes: reviewNotes })
      .then((r) => r.data),
};
