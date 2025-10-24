import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface TopCliente {
  idCliente: number;
  idSucursal: number;
  nombreSucursal: string;
  region: string;
  zona: string;
  clienteCompleto: string;
  nit: string;
  telefono: string;
  email: string;
  totalCompras: number;
  totalGastado: number;
  promedioCompra: number;
  ultimaCompra: string;
  porcentajeSucursal: number;
}

@Component({
  selector: 'app-top-clientes',
  imports: [CommonModule,FormsModule,],
  templateUrl: './top-clientes-component.html', 
  styleUrls: ['./top-clientes-component.scss']
})
export class TopClientesComponent implements OnInit {
  
  topClientes: TopCliente[] = [];
  loading = true;
  error = '';
 
  filtroSucursal: number | null = null;
  filtroZona: string = '';
  
  estadisticas: any = {};


  private apiUrl = 'http://localhost:8080/api/reportes/top-clientes';

  constructor(private http: HttpClient) {} 

  ngOnInit() {
    this.cargarTop10Clientes();
    this.cargarEstadisticas();
  }

  cargarTop10Clientes() {
    this.loading = true;
    this.error = '';
    
    this.http.get<TopCliente[]>(`${this.apiUrl}/top10-global`).subscribe({
      next: (data) => {
        this.topClientes = data;
        this.loading = false;
        console.log('Top 10 clientes cargados:', data.length);
      },
      error: (error) => {
        this.error = 'Error al cargar los clientes: ' + error.message;
        this.loading = false;
        console.error(' Error:', error);
      }
    });
  }

  cargarEstadisticas() {
    this.http.get<any>(`${this.apiUrl}/estadisticas`).subscribe({
      next: (data) => {
        this.estadisticas = data;
        console.log(' Estadísticas cargadas');
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  aplicarFiltros() {
    this.loading = true;
    this.error = '';
    
    let url = `${this.apiUrl}/top10-global`; 
    
    if (this.filtroSucursal) {
      url = `${this.apiUrl}/por-sucursal/${this.filtroSucursal}`;
    } else if (this.filtroZona) {
      url = `${this.apiUrl}/por-zona/${this.filtroZona}`;
    }

    this.http.get<TopCliente[]>(url).subscribe({
      next: (data) => {
        this.topClientes = data;
        this.loading = false;
        console.log(`Filtro aplicado: ${this.topClientes.length} clientes`);
      },
      error: (error) => {
        this.error = 'Error al aplicar filtros: ' + error.message;
        this.loading = false;
      }
    });
  }

  limpiarFiltros() {
    this.filtroSucursal = null;
    this.filtroZona = '';
    this.cargarTop10Clientes();
  }

  exportarAExcel() {
 
    const headers = ['Cliente', 'Sucursal', 'Zona', 'Total Compras', 'Total Gastado', 'Promedio', '% Sucursal'];
    const csvData = this.topClientes.map(cliente => [
      cliente.clienteCompleto,
      cliente.nombreSucursal,
      cliente.zona,
      cliente.totalCompras,
      this.formatearMoneda(cliente.totalGastado),
      this.formatearMoneda(cliente.promedioCompra),
      this.formatearPorcentaje(cliente.porcentajeSucursal)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top_clientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  formatearMoneda(valor: number): string {
    return `Q${valor?.toFixed(2) || '0.00'}`;
  }

  formatearPorcentaje(valor: number): string {
    return `${valor?.toFixed(2) || '0.00'}%`;
  }

  formatearFecha(fecha: string): string {
    return fecha ? new Date(fecha).toLocaleDateString('es-GT') : 'N/A';
  }

  
  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje > 20) return 'bg-success';
    if (porcentaje > 10) return 'bg-warning';
    return 'bg-info';
  }

  getIconoPosicion(posicion: number): string {
    switch(posicion) {
      case 0: return '1';
      case 1: return '2'; 
      case 2: return '3';
      default: return (posicion + 1).toString();
    }
  }
}