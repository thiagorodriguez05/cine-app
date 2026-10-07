import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required
    ])
  });

  mensaje = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  async login() {
    this.mensaje = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    // Iniciar sesión
    const { data, error } = await this.auth.login(
      email!,
      password!
    );

    if (error) {
      console.error('Error al iniciar sesión:', error);
      this.mensaje = 'Email o contraseña incorrectos.';
      return;
    }

    // Obtener ID del usuario
    const userId = data.user?.id;

    if (!userId) {
      this.mensaje = 'No se pudo obtener el usuario.';
      return;
    }

    // Obtener rol
    const {
      data: usuario,
      error: errorRol
    } = await this.auth.obtenerRol(userId);

    if (errorRol) {
      console.error('Error al obtener el rol:', errorRol);
      this.mensaje = 'No se pudo obtener el rol del usuario.';
      return;
    }

    if (!usuario) {
      this.mensaje = 'No se encontró el usuario.';
      return;
    }

    // Administrador
    if (usuario.rol === 'ADMIN') {
      this.router.navigate(['/admin']);
      return;
    }

    // Usuario normal
    this.router.navigate(['/']);
  }
}