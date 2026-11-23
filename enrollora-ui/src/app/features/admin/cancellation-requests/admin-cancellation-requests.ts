

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CancellationResponse,
  normalizeCancellationStatus,
} from '../../student/cancellation-requests/cancellation.models';
import { CancellationService } from '../../student/cancellation-requests/cancellation.service';

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cancellation-requests.html',
  styleUrl: './admin-cancellation-requests.css',
})
export class AdminCancellationRequests implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  searchTerm = signal('');
  statusFilter = signal('');
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  reviewTarget = signal<CancellationResponse | null>(null);
  reviewDecision = signal<'approve' | 'reject' | null>(null);
  adminRemarks = '';
  isReviewing = signal(false);
  reviewError = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  statusText(status: CancellationResponse['status']): string {
    return normalizeCancellationStatus(status);
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const statusValue = this.statusFilter() === '' ? null : Number(this.statusFilter());

    this.cancellationService
      .getAllRequests(this.pageNumber(), this.pageSize(), {
        search: this.searchTerm(),
        status: statusValue,
      })
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail || error.error?.title || 'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadRequests();
  }

  openReviewModal(req: CancellationResponse, decision: 'approve' | 'reject'): void {
    this.reviewTarget.set(req);
    this.reviewDecision.set(decision);
    this.adminRemarks = req.adminRemarks ?? '';
    this.reviewError.set('');
  }

  closeReviewModal(): void {
    if (this.isReviewing()) return;
    this.reviewTarget.set(null);
    this.reviewDecision.set(null);
    this.adminRemarks = '';
    this.reviewError.set('');
  }

  confirmReview(): void {
    const target = this.reviewTarget();
    const decision = this.reviewDecision();
    if (!target || !decision) return;

    const trimmedRemarks = this.adminRemarks.trim();
    if (trimmedRemarks.length > 1000) {
      this.reviewError.set('Remarks must be 1,000 characters or fewer.');
      return;
    }

    this.isReviewing.set(true);
    this.reviewError.set('');

    const payload = { adminRemarks: trimmedRemarks || null };
    const request$ =
      decision === 'approve'
        ? this.cancellationService.approveRequest(target.cancellationRequestId, payload)
        : this.cancellationService.rejectRequest(target.cancellationRequestId, payload);

    request$.subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.closeReviewModal();
        this.loadRequests();
      },
      error: (error: HttpErrorResponse) => {
        this.reviewError.set(
          error.error?.detail || error.error?.title || 'Unable to process review.',
        );
        this.isReviewing.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((p) => p - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((p) => p + 1);
      this.loadRequests();
    }
  }
}
