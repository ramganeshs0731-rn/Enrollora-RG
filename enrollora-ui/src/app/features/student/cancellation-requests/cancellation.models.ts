export type CancellationStatus = 0 | 1 | 2 | 'Pending' | 'Approved' | 'Rejected';

export interface CancellationResponse {
  cancellationRequestId: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  reason: string;
  status: CancellationStatus;
  requestedAt: string;
  reviewedAt: string | null;
  adminRemarks: string | null;
}

export interface CancellationFilter {
  search?: string;
  courseId?: number | null;
  status?: number | null;
  fromDate?: string;
  toDate?: string;
}

export interface CreateCancellationRequest {
  reason: string;
}

export interface ReviewCancellationRequest {
  adminRemarks?: string | null;
}

export type NormalizedCancellationStatus = 'Pending' | 'Approved' | 'Rejected';

export function normalizeCancellationStatus(
  status: CancellationStatus,
): NormalizedCancellationStatus {
  if (status === 0 || status === 'Pending') return 'Pending';
  if (status === 1 || status === 'Approved') return 'Approved';
  return 'Rejected';
}

