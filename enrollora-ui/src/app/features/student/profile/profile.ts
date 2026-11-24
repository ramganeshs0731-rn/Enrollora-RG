import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentProfile, UpdateStudentProfileRequest } from './profile.models';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly profileService = inject(ProfileService);

  profile = signal<StudentProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  formModel: UpdateStudentProfileRequest = {
    name: '',
    department: '',
    age: 18,
    cgpa: 0,
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.formModel = {
          name: data.name,
          department: data.department,
          age: data.age,
          cgpa: data.cgpa,
        };
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.detail || error.error?.message || 'Unable to load profile.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSave(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileService.updateMyProfile(this.formModel).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.formModel = {
          name: updated.name,
          department: updated.department,
          age: updated.age,
          cgpa: updated.cgpa,
        };
        this.successMessage.set('Profile updated successfully.');
        this.isSaving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.detail || error.error?.message || 'Unable to update profile.',
        );
        this.isSaving.set(false);
      },
    });
  }

  statusLabel(status: number | undefined): string {
    if (status === 1) return 'Approved';
    if (status === 2) return 'Rejected';
    return 'Pending';
  }
}