import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-lista-usuarios-component',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './lista-usuarios-component.html',
  styleUrl: './lista-usuarios-component.scss'
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuarioEditando: any = null;
  modoEdicion: boolean = false;
  mostrarFormularioCrear: boolean = false;

  // Datos para nuevo usuario
  nuevoUsuario: any = {
    nombre: '',
    correo: '',
    contrasenia: '',
    idEstado: 1,
    roles: []
  };

  rolesDisponibles: any[] = [
    { idRol: 1, nombre: 'Administrador', seleccionado: false },
    { idRol: 2, nombre: 'Jefe de Ventas', seleccionado: false },
    { idRol: 3, nombre: 'Vendedor', seleccionado: false },
    { idRol: 4, nombre: 'Almacenista', seleccionado: false }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.buscarUsuarios();
  }

  buscarUsuarios() {
    this.servicioBuscarUsuarios().subscribe(
      (usuarios: any[]) => {
        this.usuarios = usuarios;
        console.log('Usuarios cargados:', usuarios);
      }
    );
  }

  servicioBuscarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8080/api/usuarios")
      .pipe(catchError(error => {
        console.error('Error cargando usuarios:', error);
        return of([]);
      }));
  }

  // Crear nuevo usuario
  crearUsuario() {
    let formularioValido: any = document.getElementById("usuarioForm");
    if (formularioValido.reportValidity()) {
      this.servicioCrearUsuario().subscribe(
        (response: any) => this.validarCreacion(response)
      );
    }
  }

  servicioCrearUsuario() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>("http://localhost:8080/api/usuarios", this.nuevoUsuario, httpOptions)
      .pipe(catchError(error => {
        console.error('Error creando usuario:', error);
        return of(error.error);
      }));
  }

  validarCreacion(response: any) {
    if (response && response.idUsuario) {
      alert("Usuario creado exitosamente");
      this.buscarUsuarios();
      this.cancelarCreacion();
    } else {
      alert("Error al crear usuario: " + (response || 'Credenciales duplicadas'));
    }
  }

  // Eliminar usuario (dar de baja)
  eliminarUsuario(id: number) {
    if (confirm('¿Estás seguro de dar de baja este usuario?')) {
      this.servicioEliminarUsuario(id).subscribe(
        (response: any) => this.validarEliminacion(response)
      );
    }
  }

  servicioEliminarUsuario(id: number) {
    return this.http.patch<any>(`http://localhost:8080/api/usuarios/${id}/baja`, {})
      .pipe(catchError(error => {
        console.error('Error eliminando usuario:', error);
        return of(null);
      }));
  }

  validarEliminacion(response: any) {
    if (response) {
      alert("Usuario dado de baja exitosamente");
      this.buscarUsuarios();
    } else {
      alert("Error al dar de baja usuario");
    }
  }

  // Activar usuario
  activarUsuario(id: number) {
    if (confirm('¿Estás seguro de activar este usuario?')) {
      this.servicioActivarUsuario(id).subscribe(
        (response: any) => this.validarActivacion(response)
      );
    }
  }

  servicioActivarUsuario(id: number) {
    return this.http.patch<any>(`http://localhost:8080/api/usuarios/${id}/activar`, {})
      .pipe(catchError(error => {
        console.error('Error activando usuario:', error);
        return of(null);
      }));
  }

  validarActivacion(response: any) {
    if (response) {
      alert("Usuario activado exitosamente");
      this.buscarUsuarios();
    } else {
      alert("Error al activar usuario");
    }
  }

  // Editar usuario
  iniciarEdicion(usuario: any) {
    this.usuarioEditando = { ...usuario };
    // Marcar roles seleccionados
    this.rolesDisponibles.forEach(rol => {
      rol.seleccionado = this.usuarioEditando.roles?.some((r: any) => r.idRol === rol.idRol) || false;
    });
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.usuarioEditando = null;
    this.modoEdicion = false;
  }

  guardarEdicion() {
    if (this.usuarioEditando) {
      this.actualizarRolesUsuario();
      this.servicioActualizarUsuario(this.usuarioEditando).subscribe(
        (response: any) => this.validarActualizacion(response)
      );
    }
  }

  servicioActualizarUsuario(usuario: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.put<any>(`http://localhost:8080/api/usuarios/${usuario.idUsuario}`, usuario, httpOptions)
      .pipe(catchError(error => {
        console.error('Error actualizando usuario:', error);
        return of(null);
      }));
  }

  validarActualizacion(response: any) {
    if (response && response.idUsuario) {
      alert("Usuario actualizado exitosamente");
      this.buscarUsuarios();
      this.cancelarEdicion();
    } else {
      alert("Error al actualizar usuario");
    }
  }

  // Gestión de roles
  toggleRolCreacion(rol: any) {
    rol.seleccionado = !rol.seleccionado;
    this.actualizarRolesCreacion();
  }

  toggleRolEdicion(rol: any) {
    rol.seleccionado = !rol.seleccionado;
  }

  actualizarRolesCreacion() {
    this.nuevoUsuario.roles = this.rolesDisponibles
      .filter(rol => rol.seleccionado)
      .map(rol => ({ idRol: rol.idRol, nombre: rol.nombre }));
  }

  actualizarRolesUsuario() {
    if (this.usuarioEditando) {
      this.usuarioEditando.roles = this.rolesDisponibles
        .filter(rol => rol.seleccionado)
        .map(rol => ({ idRol: rol.idRol, nombre: rol.nombre }));
    }
  }

  // Formulario de creación
  mostrarFormulario() {
    this.mostrarFormularioCrear = true;
  }

  cancelarCreacion() {
    this.mostrarFormularioCrear = false;
    this.nuevoUsuario = {
      nombre: '',
      correo: '',
      contrasenia: '',
      idEstado: 1,
      roles: []
    };
    this.rolesDisponibles.forEach(rol => rol.seleccionado = false);
  }

  volverInicio() {
    this.router.navigate(['/welcome']);
  }

  getEstadoTexto(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClase(estado: number): string {
    return estado === 1 ? 'badge-estado activo' : 'badge-estado inactivo';
  }
}