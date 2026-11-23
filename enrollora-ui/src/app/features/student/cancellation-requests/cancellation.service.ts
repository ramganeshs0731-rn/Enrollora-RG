import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../shared/models/paged-result.model';
import {
  CancellationFilter,
  CancellationResponse,
  CreateCancellationRequest,
  ReviewCancellationRequest,
} from './cancellation.models';

@Injectable({
  providedIn: 'root',
})
export class CancellationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cancellation-requests`;

  getAllRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter,
  ): Observable<PagedResult<CancellationResponse>> {
    return this.http.get<PagedResult<CancellationResponse>>(this.apiUrl, {
      params: this.buildParams(pageNumber, pageSize, filters),
    });
  }

  getMyRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter,
  ): Observable<PagedResult<CancellationResponse>> {
    return this.http.get<PagedResult<CancellationResponse>>(`${this.apiUrl}/my`, {
      params: this.buildParams(pageNumber, pageSize, filters),
    });
  }

  createRequest(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${environment.apiUrl}/enrollments/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  approveRequest(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/approve`,
      request,
    );
  }

  rejectRequest(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/reject`,
      request,
    );
  }

  private buildParams(
    pageNumber: number,
    pageSize: number,
    filters?: CancellationFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }
    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }
    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return params;
  }
}
