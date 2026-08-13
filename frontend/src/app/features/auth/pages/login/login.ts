import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiErrorResponse } from '../../../../core/auth/auth.models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected errorMessage: string | null = null;
  protected successMessage: string | null = null;
  protected submitting = false;

  constructor() {
    if (this.router.getCurrentNavigation()?.extras.state?.['registered']) {
      this.successMessage = 'Cuenta creada correctamente. Inicia sesión.';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Completa correctamente los campos del formulario.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    const { email, password } = this.form.getRawValue();

    this.authService
      .login(email, password)
      .then(() => this.router.navigate(['/dashboard']))
      .catch((error: HttpErrorResponse) => {
        this.errorMessage = this.extractMessage(error) ?? 'No se pudo iniciar sesión.';
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  private extractMessage(error: HttpErrorResponse): string | null {
    const body = error.error as ApiErrorResponse | undefined;
    return body?.error?.message ?? null;
  }
}
