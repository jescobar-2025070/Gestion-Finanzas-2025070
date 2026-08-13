import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorResponse } from '../../../../core/auth/auth.models';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), this.letterAndNumber],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  }, { validators: this.passwordsMatch });

  protected errorMessage: string | null = null;
  protected submitting = false;
  protected showPassword = false;

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Revisa los campos del formulario.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    const { email, password } = this.form.getRawValue();

    this.authService
      .register(email, password)
      .then(() => this.router.navigate(['/login'], { state: { registered: true } }))
      .catch((error: HttpErrorResponse) => {
        this.errorMessage = this.extractMessage(error) ?? 'No se pudo completar el registro.';
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  private extractMessage(error: HttpErrorResponse): string | null {
    const body = error.error as ApiErrorResponse | undefined;
    return body?.error?.message ?? null;
  }

  private letterAndNumber(control: AbstractControl): Record<string, boolean> | null {
    const value = control.value as string;
    if (!value) {
      return null;
    }
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasLetter && hasNumber ? null : { letterAndNumber: true };
  }

  private passwordsMatch(group: AbstractControl): Record<string, boolean> | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
