import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-lista-clientes-component',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './lista-clientes-component.html',
  styleUrl: './lista-clientes-component.scss'
})
export class ListaClientesComponent implements OnInit {
  clientes: any[] = [];
  clienteEditando: any = null;
  modoEdicion: boolean = false;
  facturasCliente: any[] = []; // Para almacenar facturas del cliente seleccionado
  mostrarFacturas: boolean = false; // Controlar visibilidad del modal de facturas
  clienteSeleccionado: any = null; // Cliente del que se ven las facturas

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.buscarClientes();
  }

  buscarClientes() {
    this.servicioBuscarClientes().subscribe(
      (clientes: any[]) => {
        this.clientes = clientes;
        console.log('Clientes cargados:', clientes);
      }
    );
  }

  servicioBuscarClientes(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8080/api/clientes")
      .pipe(catchError(error => {
        console.error('Error cargando clientes:', error);
        return of([]);
      }));
  }

  // === NUEVO: Métodos para gestionar facturas del cliente ===

  // Ver facturas de un cliente específico
  verFacturasCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.cargarFacturasCliente(cliente.idCliente);
  }

  // Cargar facturas del cliente desde la API
  cargarFacturasCliente(idCliente: number) {
    this.http.get<any[]>(`http://localhost:8080/api/facturas/cliente/${idCliente}`)
      .pipe(catchError(error => {
        console.error('Error cargando facturas del cliente:', error);
        return of([]);
      }))
      .subscribe((facturas: any[]) => {
        this.facturasCliente = facturas;
        this.mostrarFacturas = true;
        console.log('Facturas del cliente:', facturas);
      });
  }

  // Cerrar el modal de facturas
  cerrarFacturas() {
    this.mostrarFacturas = false;
    this.facturasCliente = [];
    this.clienteSeleccionado = null;
  }

  // Navegar al módulo completo de facturas
  irAFacturas() {
    this.router.navigate(['/facturas']);
  }

  // Formatear moneda (para las facturas)
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(monto || 0);
  }

  // Formatear fecha (para las facturas)
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PY');
  }

  // Obtener clase CSS para el estado de la factura
  getEstadoFacturaClase(estado: any): string {
    if (typeof estado === 'object' && estado.nombre) {
      switch(estado.nombre.toLowerCase()) {
        case 'pagado':
        case 'activo':
          return 'badge bg-success';
        case 'pendiente':
          return 'badge bg-warning';
        case 'anulado':
        case 'cancelado':
          return 'badge bg-danger';
        default:
          return 'badge bg-secondary';
      }
    }
    return 'badge bg-secondary';
  }

  // Obtener texto del estado de la factura
  getEstadoFacturaTexto(estado: any): string {
    if (typeof estado === 'object' && estado.nombre) {
      return estado.nombre;
    }
    return 'Desconocido';
  }

  // === MÉTODOS EXISTENTES (los que ya tenías) ===

  eliminarCliente(id: number) {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.servicioEliminarCliente(id).subscribe(
        (response: any) => this.validarEliminacion(response)
      );
    }
  }

  servicioEliminarCliente(id: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.delete<any>(`http://localhost:8080/api/clientes/${id}`, httpOptions)
      .pipe(catchError(error => {
        console.error('Error eliminando cliente:', error);
        return of(null);
      }));
  }

  validarEliminacion(response: any) {
    if (response === null) {
      alert("Error al eliminar cliente");
    } else {
      alert("Cliente eliminado exitosamente");
      this.buscarClientes();
    }
  }

  iniciarEdicion(cliente: any) {
    this.clienteEditando = { ...cliente };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.clienteEditando = null;
    this.modoEdicion = false;
  }

  guardarEdicion() {
    if (this.clienteEditando) {
      this.servicioActualizarCliente(this.clienteEditando).subscribe(
        (response: any) => this.validarActualizacion(response)
      );
    }
  }

  servicioActualizarCliente(cliente: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.put<any>(`http://localhost:8080/api/clientes/${cliente.idCliente}`, cliente, httpOptions)
      .pipe(catchError(error => {
        console.error('Error actualizando cliente:', error);
        return of(null);
      }));
  }

  validarActualizacion(response: any) {
    if (response && response.idCliente) {
      alert("Cliente actualizado exitosamente");
      this.buscarClientes();
      this.cancelarEdicion();
    } else {
      alert("Error al actualizar cliente");
    }
  }

  volverInicio() {
    this.router.navigate(['/welcome']);
  }

  getEstadoTexto(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClase(estado: number): string {
    return estado === 1 ? 'badge bg-success' : 'badge bg-danger';
  }
}