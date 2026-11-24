import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StudentProfile, UpdateStudentProfileRequest } from './profile.models';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/students/me`;

  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(this.apiUrl);
  }

  updateMyProfile(request: UpdateStudentProfileRequest): Observable<StudentProfile> {
    return this.http.put<StudentProfile>(this.apiUrl, request);
  }
}


