import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proveedores-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './proveedores-component.html',
  styleUrl: './proveedores-component.scss'
})
export class ProveedoresComponent implements OnInit {
  proveedores: any[] = [];
  proveedorEditando: any = null;
  mostrarFormulario: boolean = false;
  estados: any[] = [];

  nuevoProveedor: any = {
    nombre: '',
    contacto: '',
    direccion: '',
    email: '',
    idEstado: 1
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarProveedores();
    this.cargarEstados();
  }

  cargarProveedores() {
    this.http.get<any[]>('http://localhost:8080/api/proveedores')
      .subscribe({
        next: (proveedores) => {
          console.log(' Proveedores recibidos:', proveedores);
      
       
          this.proveedores = (proveedores || []).map(proveedor => {
            return {
              ...proveedor,
       
              idEstado: this.obtenerIdEstadoSeguro(proveedor),
              // Si el estado viene como null, crear objeto por defecto
              estado: proveedor.estado || { id_estado: 1, nombre: 'ACTIVO', tipo_estado: 'GENERAL' }
            };
          });
          
          console.log(' Proveedores normalizados:', this.proveedores);
        },
        error: (error) => {
          console.error(' Error cargando proveedores:', error);
          alert('Error al cargar proveedores: ' + error.message);
        }
      });
  }


  private obtenerIdEstadoSeguro(proveedor: any): number {
    if (!proveedor) return 1;
  
    if (proveedor.idEstado !== null && proveedor.idEstado !== undefined && !isNaN(proveedor.idEstado)) {
      return Number(proveedor.idEstado);
    }
 
    if (proveedor.estado && proveedor.estado.id_estado !== null && proveedor.estado.id_estado !== undefined) {
      return Number(proveedor.estado.id_estado);
    }
   
    return 1;
  }

  cargarEstados() {
    this.http.get<any[]>('http://localhost:8080/api/estados')
      .subscribe({
        next: (estados) => {
          this.estados = estados;
        },
        error: (error) => {
          console.error('Error cargando estados:', error);
        }
      });
  }

  // Crear nuevo proveedor
  crearProveedor() {
    if (!this.validarProveedor()) return;

    const proveedorParaEnviar = {
      nombre: this.nuevoProveedor.nombre,
      contacto: this.nuevoProveedor.contacto,
      direccion: this.nuevoProveedor.direccion,
      email: this.nuevoProveedor.email,
      idEstado: this.nuevoProveedor.idEstado || 1
    };

    this.http.post('http://localhost:8080/api/proveedores', proveedorParaEnviar)
      .subscribe({
        next: (response: any) => {
          alert('Proveedor creado exitosamente');
          this.cargarProveedores();
          this.cancelarCreacion();
        },
        error: (error) => {
          console.error('Error creando proveedor:', error);
          alert('Error al crear proveedor: ' + (error.error?.message || error.message));
        }
      });
  }

  // Editar proveedor
  editarProveedor(proveedor: any) {
    this.proveedorEditando = { 
      ...proveedor,
      
      idEstado: this.obtenerIdEstadoSeguro(proveedor)
    };
    this.mostrarFormulario = true;
  }

  actualizarProveedor() {
  if (!this.validarProveedor()) return;

  // Enviar idEstado en lugar del objeto estado
  const proveedorActualizado = {
    nombre: this.proveedorEditando.nombre,
    contacto: this.proveedorEditando.contacto || '',
    direccion: this.proveedorEditando.direccion || '',
    email: this.proveedorEditando.email || '',
    idEstado: this.proveedorEditando.idEstado || 1 // ← Enviar idEstado, no estado
  };

  this.http.put(`http://localhost:8080/api/proveedores/${this.proveedorEditando.idProveedor}`, proveedorActualizado)
    .subscribe({
      next: (response: any) => {
        alert('Proveedor actualizado exitosamente');
        this.cargarProveedores();
        this.cancelarEdicion();
      },
      error: (error) => {
        console.error('Error actualizando proveedor:', error);
        alert('Error al actualizar proveedor');
      }
    });
}
  // Eliminar proveedor (cambiar estado a inactivo)
  desactivarProveedor(proveedor: any) {
    if (confirm(`¿Estás seguro de desactivar al proveedor ${proveedor.nombre}?`)) {
      const proveedorActualizado = {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto,
        direccion: proveedor.direccion,
        email: proveedor.email,
        idEstado: 2 // INACTIVO
      };

      this.http.put(`http://localhost:8080/api/proveedores/${proveedor.idProveedor}`, proveedorActualizado)
        .subscribe({
          next: (response: any) => {
            alert('Proveedor desactivado exitosamente');
            this.cargarProveedores();
          },
          error: (error) => {
            console.error('Error desactivando proveedor:', error);
            alert('Error al desactivar proveedor');
          }
        });
    }
  }

  // Activar proveedor
  activarProveedor(proveedor: any) {
    if (confirm(`¿Estás seguro de activar al proveedor ${proveedor.nombre}?`)) {
      const proveedorActualizado = {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto,
        direccion: proveedor.direccion,
        email: proveedor.email,
        idEstado: 1 // ACTIVO
      };

      this.http.put(`http://localhost:8080/api/proveedores/${proveedor.idProveedor}`, proveedorActualizado)
        .subscribe({
          next: (response: any) => {
            alert(' Proveedor activado exitosamente');
            this.cargarProveedores();
          },
          error: (error) => {
            console.error('Error activando proveedor:', error);
            alert('Error al activar proveedor');
          }
        });
    }
  }

  // Validaciones
  validarProveedor(): boolean {
    const nombre = this.proveedorEditando ? this.proveedorEditando.nombre : this.nuevoProveedor.nombre;
    const contacto = this.proveedorEditando ? this.proveedorEditando.contacto : this.nuevoProveedor.contacto;

    if (!nombre?.trim()) {
      alert('El nombre del proveedor es requerido');
      return false;
    }
    if (!contacto?.trim()) {
      alert('El contacto del proveedor es requerido');
      return false;
    }
    return true;
  }

  // Navegación y UI
  mostrarFormularioCrear() {
    this.mostrarFormulario = true;
    this.proveedorEditando = null;
    this.nuevoProveedor = {
      nombre: '',
      contacto: '',
      direccion: '',
      email: '',
      idEstado: 1
    };
  }

  cancelarCreacion() {
    this.mostrarFormulario = false;
    this.nuevoProveedor = {
      nombre: '',
      contacto: '',
      direccion: '',
      email: '',
      idEstado: 1
    };
  }

  cancelarEdicion() {
    this.mostrarFormulario = false;
    this.proveedorEditando = null;
  }

  volverInicio() {
    this.router.navigate(['/welcome']);
  }

  // Utilidades
  trackByProveedor(index: number, proveedor: any): number {
    return proveedor.idProveedor;
  }

  getEstadoTexto(estado: any): string {
    const estadoId = this.obtenerIdEstadoSeguro({ estado });
    return estadoId === 1 ? 'ACTIVO' : 'INACTIVO';
  }

  getEstadoClase(estado: any): string {
    const estadoId = this.obtenerIdEstadoSeguro({ estado });
    return estadoId === 1 ? 'badge bg-success' : 'badge bg-secondary';
  }

  estaActivo(proveedor: any): boolean {
    return this.obtenerIdEstadoSeguro(proveedor) === 1;
  }
}