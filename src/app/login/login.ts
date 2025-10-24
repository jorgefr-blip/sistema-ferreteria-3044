import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const credentials = {
        correo: this.loginForm.value.correo,
        contrasenia: this.loginForm.value.contrasenia
      };

      this.http.post<any>('http://localhost:8080/api/usuarios/login', credentials)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
          
              localStorage.setItem('currentUser', JSON.stringify(response.usuario));
              localStorage.setItem('token', response.token);
              localStorage.setItem('userRoles', JSON.stringify(response.usuario.roles));
              
              console.log('Login exitoso:', response.usuario);
              this.router.navigate(['/welcome']);
            } else {
              this.errorMessage = response.message;
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = 'Error de conexión con el servidor';
            console.error('Login error:', error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

 
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get correo() { return this.loginForm.get('correo'); }
  get contrasenia() { return this.loginForm.get('contrasenia'); }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.loginForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }
}