import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  registroForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
    ]),

    apellido: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
    ]),

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6)
    ]),

    fechaNacimiento: new FormControl('', [
      Validators.required
    ]),

    tipoSangre: new FormControl('', [
      Validators.required
    ]),

    colorOjos: new FormControl('', [
      Validators.required
    ])
  });

  mensaje = '';

  fechaMinima = '1900-01-01';
  fechaMaxima = new Date().toISOString().split('T')[0];

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  async registrar() {
    this.mensaje = '';

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const {
      nombre,
      apellido,
      email,
      password,
      fechaNacimiento,
      tipoSangre,
      colorOjos
    } = this.registroForm.value;

    if (!this.fechaValida(fechaNacimiento!)) {
      this.registroForm.controls.fechaNacimiento.setErrors({
        fechaInvalida: true
      });

      this.mensaje = 'Ingresá una fecha de nacimiento válida.';
      return;
    }

    const { data, error } = await this.auth.registrar(
      email!,
      password!,
      {
        nombre: nombre!,
        apellido: apellido!,
        fecha_de_nacimiento: fechaNacimiento!,
        tipo_de_sangre: tipoSangre!,
        color_de_ojos: colorOjos!
      }
    );

    if (error || !data.user) {
      console.error('Error al registrar usuario:', error);

      if (error?.message.includes('already registered')) {
        this.mensaje = 'El email ya está registrado.';
      } else if (error?.status === 429) {
        this.mensaje =
          'Demasiados intentos. Esperá unos segundos y volvé a intentar.';
      } else {
        this.mensaje = 'No se pudo crear la cuenta.';
      }

      return;
    }

    alert('Cuenta creada correctamente.');

    this.router.navigate(['/login']);
  }

  fechaValida(fecha: string): boolean {
    if (!fecha) {
      return false;
    }

    const fechaIngresada = new Date(`${fecha}T00:00:00`);
    const fechaMinima = new Date(`${this.fechaMinima}T00:00:00`);
    const fechaMaxima = new Date(`${this.fechaMaxima}T00:00:00`);

    if (Number.isNaN(fechaIngresada.getTime())) {
      return false;
    }

    return (
      fechaIngresada >= fechaMinima &&
      fechaIngresada <= fechaMaxima
    );
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}