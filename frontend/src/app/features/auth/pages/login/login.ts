import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

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
  protected sessionExpiredMessage: string | null = null;
  protected submitting = false;
  protected showPassword = false;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state?.['registered']) {
      this.successMessage = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
    }

    if (this.authService.sessionExpired) {
      this.authService.sessionExpired = false;
      this.sessionExpiredMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Completa correctamente los campos del formulario.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    this.sessionExpiredMessage = null;
    const { email, password } = this.form.getRawValue();

    this.authService
      .login(email, password)
      .then(() => this.router.navigate(['/dashboard']))
      .catch((error: any) => {
        const msg = error?.error?.error?.message;
        this.errorMessage = msg || 'No se pudo iniciar sesión. Verifica tus credenciales.';
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
