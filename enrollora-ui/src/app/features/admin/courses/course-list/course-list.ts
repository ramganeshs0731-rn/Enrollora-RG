
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Modal state
  showForm = signal(false);
  isEditMode = signal(false);
  isSaving = signal(false);

  // Selected course ID
  selectedCourseId: number | null = null;

  // Course form data
  formData: SaveCourseRequest = this.emptyForm();

  ngOnInit(): void {
    this.loadCourses();
  }

  emptyForm(): SaveCourseRequest {
    return {
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    };
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage.set('Unable to load courses.');
        this.isLoading.set(false);
      },
    });
  }

  // Open form for adding a new course
  openAddForm(): void {
    this.isEditMode.set(false);
    this.selectedCourseId = null;
    this.formData = this.emptyForm();
    this.successMessage.set('');
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  // Open form for editing an existing course
  openEditForm(course: CourseResponse): void {
    this.isEditMode.set(true);
    this.selectedCourseId = course.courseId;

    this.formData = {
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    };

    this.successMessage.set('');
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.isSaving()) return;
    this.showForm.set(false);
  }

  // Add or update course
  saveCourse(): void {
    if (
      !this.formData.courseName.trim() ||
      !this.formData.duration.trim() ||
      this.formData.fees < 0 ||
      this.formData.capacity < 1
    ) {
      this.errorMessage.set('Please enter valid course details.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const request: SaveCourseRequest = {
      courseName: this.formData.courseName.trim(),
      duration: this.formData.duration.trim(),
      fees: Number(this.formData.fees),
      capacity: Number(this.formData.capacity),
      isActive: this.formData.isActive,
    };

    const operation = this.isEditMode()
      ? this.courseService.updateCourse(this.selectedCourseId!, request)
      : this.courseService.createCourse(request);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);

        this.successMessage.set(
          this.isEditMode()
            ? 'Course updated successfully!'
            : 'Course created successfully!',
        );

        this.loadCourses();
      },
      error: (error) => {
        console.error('Save course error:', error);
        this.isSaving.set(false);
        this.errorMessage.set(
          error.error?.message || 'Unable to save course. Please try again.',
        );
      },
    });
  }

  // Deactivate course
  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${course.courseName}"?`,
    );

    if (!confirmed) return;

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.successMessage.set('Course deactivated successfully!');
        this.loadCourses();
      },
      error: (error) => {
        console.error('Deactivate course error:', error);
        this.errorMessage.set(
          error.error?.message || 'Unable to deactivate course.',
        );
      },
    });
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}
