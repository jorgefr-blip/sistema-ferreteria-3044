import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-lista-facturas-component',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './lista-facturas-component.html',
  styleUrl: './lista-facturas-component.scss'
})
export class ListaFacturasComponent implements OnInit {
  facturas: any[] = [];
  facturaEditando: any = null;
  detallesFacturaEditando: any[] = [];
  modoEdicion: boolean = false;
  loading: boolean = false;

  // Filtros
  filtroNumero: string = '';
  filtroCliente: string = '';
  filtroEstado: string = '';

  // Estados disponibles
  estados: any[] = [
    { id_estado: 1, nombre: 'ACTIVO' },
    { id_estado: 4, nombre: 'COMPLETADO' },
    { id_estado: 5, nombre: 'CANCELADO' }
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.buscarFacturas();
  }

  buscarFacturas() {
    this.loading = true;
    this.servicioBuscarFacturas().subscribe(
      (facturas: any[]) => {
        this.facturas = facturas;
        this.loading = false;
        console.log('Facturas cargadas:', facturas);
      }
    );
  }

  servicioBuscarFacturas(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8080/api/facturas")
      .pipe(catchError(error => {
        console.error('Error cargando facturas:', error);
        return of([]);
      }));
  }

  // Cargar detalles de una factura específica
  cargarDetallesFactura(idFactura: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/detalles-factura/factura/${idFactura}`)
      .pipe(catchError(error => {
        console.error('Error cargando detalles de factura:', error);
        return of([]);
      }));
  }

  // Eliminar factura
  eliminarFactura(id: number) {
    if (confirm('¿Estás seguro de eliminar esta factura? También se eliminarán sus detalles y pagos asociados.')) {
      this.servicioEliminarFactura(id).subscribe(
        (response: any) => this.validarEliminacion(response)
      );
    }
  }

  servicioEliminarFactura(id: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.delete<any>(`http://localhost:8080/api/facturas/${id}`, httpOptions)
      .pipe(catchError(error => {
        console.error('Error eliminando factura:', error);
        return of(null);
      }));
  }

  validarEliminacion(response: any) {
    if (response === null) {
      alert("Factura eliminada exitosamente");
      this.buscarFacturas();
    } else {
      alert("Error al eliminar factura");
    }
  }

  // Ver detalles de factura
  verDetalles(factura: any) {
    this.facturaEditando = { ...factura };
    this.modoEdicion = true;
    
    // Cargar los detalles de esta factura
    this.cargarDetallesFactura(factura.idFactura).subscribe(
      (detalles: any[]) => {
        this.detallesFacturaEditando = detalles;
        console.log('Detalles de factura cargados:', detalles);
      }
    );
  }

  cancelarEdicion() {
    this.facturaEditando = null;
    this.detallesFacturaEditando = [];
    this.modoEdicion = false;
  }

  // Filtrar facturas
  get facturasFiltradas() {
    return this.facturas.filter(factura => {
      const coincideNumero = factura.numero?.toLowerCase().includes(this.filtroNumero.toLowerCase());
      const coincideCliente = factura.cliente?.nombre?.toLowerCase().includes(this.filtroCliente.toLowerCase()) ||
                            factura.cliente?.apellido?.toLowerCase().includes(this.filtroCliente.toLowerCase());
      const coincideEstado = !this.filtroEstado || 
                           factura.estado?.id_estado?.toString() === this.filtroEstado;

      return coincideNumero && coincideCliente && coincideEstado;
    });
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroNumero = '';
    this.filtroCliente = '';
    this.filtroEstado = '';
  }

  volverInicio() {
    this.router.navigate(['/welcome']);
  }

  getEstadoTexto(estado: any): string {
    if (typeof estado === 'object' && estado.id_estado) {
      return estado.id_estado === 1 ? 'Activo' : 
             estado.id_estado === 4 ? 'Completado' : 
             estado.id_estado === 5 ? 'Cancelado' : 'Inactivo';
    }
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClase(estado: any): string {
    const estadoId = typeof estado === 'object' && estado.id_estado ? estado.id_estado : estado;
    
    switch(estadoId) {
      case 1: return 'badge-estado activo';
      case 4: return 'badge-estado completado';
      case 5: return 'badge-estado cancelado';
      default: return 'badge-estado inactivo';
    }
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // Formatear moneda
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);
  }

  // Obtener nombre completo del cliente
  getNombreCliente(factura: any): string {
    if (!factura.cliente) return 'Cliente no encontrado';
    return `${factura.cliente.nombre || ''} ${factura.cliente.apellido || ''}`.trim();
  }
}