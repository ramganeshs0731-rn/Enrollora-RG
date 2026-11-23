import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnrollmentResponse } from '../../enrollments/enrollment.models';
import { EnrollmentService } from '../../enrollments/enrollment.service';
import {
  CancellationResponse,
  normalizeCancellationStatus,
} from './cancellation.models';
import { CancellationService } from './cancellation.service';

@Component({
  selector: 'app-student-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-cancellation-requests.html',
  styleUrl: './student-cancellation-requests.css',
})
export class StudentCancellationRequests implements OnInit {
  private readonly cancellationService = inject(CancellationService);
  private readonly enrollmentService = inject(EnrollmentService);

  requests = signal<CancellationResponse[]>([]);
  activeEnrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  isLoadingEnrollments = signal(false);
  errorMessage = signal('');

  statusFilter = signal<string>('');
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  isModalOpen = signal(false);
  isSubmitting = signal(false);
  formError = signal('');
  selectedEnrollmentId = signal<number | null>(null);
  reason = '';

  ngOnInit(): void {
    this.loadRequests();
    this.loadActiveEnrollments();
  }

  statusText(status: CancellationResponse['status']): string {
    return normalizeCancellationStatus(status);
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const statusValue = this.statusFilter() === '' ? null : Number(this.statusFilter());

    this.cancellationService
      .getMyRequests(this.pageNumber(), this.pageSize(), { status: statusValue })
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

  loadActiveEnrollments(): void {
    this.isLoadingEnrollments.set(true);
    this.enrollmentService.getMyEnrollments(1, 50).subscribe({
      next: (res) => {
        const activeOnly = res.items.filter(
          (e) => e.status === 0 || String(e.status) === 'Active',
        );
        this.activeEnrollments.set(activeOnly);
        this.isLoadingEnrollments.set(false);
      },
      error: () => {
        this.isLoadingEnrollments.set(false);
      },
    });
  }

  onFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.pageNumber.set(1);
    this.loadRequests();
  }

  openNewRequestModal(): void {
    this.formError.set('');
    this.reason = '';
    const firstActive = this.activeEnrollments()[0]?.enrollmentId ?? null;
    this.selectedEnrollmentId.set(firstActive);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    if (this.isSubmitting()) return;
    this.isModalOpen.set(false);
    this.formError.set('');
  }

  submitRequest(): void {
    const enrollmentId = this.selectedEnrollmentId();
    const trimmedReason = this.reason.trim();

    if (!enrollmentId) {
      this.formError.set('Please select an active enrollment.');
      return;
    }

    if (!trimmedReason || trimmedReason.length > 1000) {
      this.formError.set('Reason is required (up to 1,000 characters).');
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set('');

    this.cancellationService
      .createRequest(enrollmentId, { reason: trimmedReason })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isModalOpen.set(false);
          this.pageNumber.set(1);
          this.loadRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.formError.set(
            error.error?.detail ||
              error.error?.title ||
              'Unable to submit cancellation request.',
          );
          this.isSubmitting.set(false);
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