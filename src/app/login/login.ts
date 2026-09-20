import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup
} from '@angular/forms';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });

  mensaje: string = '';

  constructor(
    private auth: Auth,
    private router: Router
  ) {
    
  }

  async login() {

    // Limpiamos cualquier mensaje anterior
    this.mensaje = '';

    // Obtenemos los datos del formulario
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    // Intentamos iniciar sesión
    const { data, error } = await this.auth.login(
      email!,
      password!
    );

    // Si las credenciales son incorrectas
    if (error) {
      this.mensaje = 'Email o contraseña incorrectos';
      alert('Email o contraseña incorrectos');
      console.log(error);
      return;
    }

    // Obtenemos el ID del usuario que inició sesión
    const userId = data.user?.id;
    console.log('ID del usuario:', userId);

    // Si no conseguimos el ID
    if (!userId) {
      this.mensaje = 'No se pudo obtener el usuario';
      return;
    }

    // Buscamos el rol del usuario en la tabla usuarios
    const { data: usuario, error: errorRol } =
      await this.auth.obtenerRol(userId);

    // Si hubo un error buscando el rol
    if (errorRol) {
      this.mensaje = 'No se pudo obtener el rol del usuario';
      console.log(errorRol);
      return;
    }

    // Verificamos que exista el usuario
    if (!usuario) {
      this.mensaje = 'No se encontró el usuario';
      return;
    }

    
    // Mostramos el rol en la consola
    console.log('Rol del usuario:', usuario.rol);
    
    if(usuario.rol === 'ADMIN'){
        this.router.navigate(['/admin']);
        return;
    }

    // Login correcto
    this.mensaje = 'Inicio de sesión correcto';
    alert('Inicio de sesión correcto');


    console.log(data);
  }
}