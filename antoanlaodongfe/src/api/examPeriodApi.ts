import apiClient from './client';
import type { PaginatedResponse, StatusResponse } from '@/types/common';
import type { ExamType, ApprovalStatus } from '@/types/enums';

export interface ExamPeriodResponse {
  id: string;
  name: string;
  description: string | null;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  department_ids: string[];
  target_occupations: string[];
  target_skill_levels: number[];
  status: string;
  approval_status: ApprovalStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExamPeriodRequest {
  name: string;
  description?: string;
  exam_type: ExamType;
  start_date: string;
  end_date: string;
  department_ids?: string[];
  target_occupations?: string[];
  target_skill_levels?: number[];
}

export interface ExamPeriodUpdateRequest extends Partial<ExamPeriodRequest> {
  status?: string;
  approval_status?: ApprovalStatus;
  reject_reason?: string;
}

export interface ExamPeriodListFilters {
  exam_type?: ExamType;
  status?: string;
  department_id?: string;
  page?: number;
  page_size?: number;
}

export const examPeriodApi = {
  list: (params: ExamPeriodListFilters = {}) =>
    apiClient
      .get<PaginatedResponse<ExamPeriodResponse>>('/exam-periods', { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<ExamPeriodResponse>(`/exam-periods/${id}`).then((r) => r.data),

  create: (data: ExamPeriodRequest) =>
    apiClient.post<ExamPeriodResponse>('/exam-periods', data).then((r) => r.data),

  update: (id: string, data: ExamPeriodUpdateRequest) =>
    apiClient.put<ExamPeriodResponse>(`/exam-periods/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<StatusResponse>(`/exam-periods/${id}`).then((r) => r.data),

  submitForReview: (id: string) =>
    apiClient.put<ExamPeriodResponse>(`/exam-periods/${id}`, { approval_status: 'pending_dept_review' as ApprovalStatus }).then((r) => r.data),
};
