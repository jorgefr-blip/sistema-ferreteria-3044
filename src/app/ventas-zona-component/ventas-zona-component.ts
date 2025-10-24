import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface VentaZona {
  idRegion: number;
  region: string;
  zona: string;
  idSucursal: number;
  sucursal: string;
  mes: string;
  mesNombre: string;
  totalVentas: number;
  montoTotal: number;
  promedioVenta: number;
  ventaMinima: number;
  ventaMaxima: number;
  clientesAtendidos: number;
  vendedoresActivos: number;
  porcentajeGlobal: number;
}

@Component({
  selector: 'app-ventas-zona',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas-zona-component.html',
  styleUrls: ['./ventas-zona-component.scss']
})
export class VentasZonaComponent implements OnInit {
  
  ventasZona: VentaZona[] = [];
  loading = true;
  error = '';
  

  filtroZona: string = '';
  filtroRegion: string = '';
  filtroMes: string = '';
 
  zonasDisponibles: string[] = [];
  mesesDisponibles: string[] = [];
 
  estadisticas: any = {};

  private apiUrl = 'http://localhost:8080/api/reportes/ventas-zona';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarVentasZona();
    this.cargarEstadisticas();
    this.cargarFiltros();
  }

  cargarVentasZona() {
    this.loading = true;
    this.error = '';
    
    this.http.get<VentaZona[]>(`${this.apiUrl}/todas`).subscribe({
      next: (data) => {
        this.ventasZona = data;
        this.loading = false;
        console.log(' Ventas por zona cargadas:', data.length);
      },
      error: (error) => {
        this.error = 'Error al cargar las ventas por zona: ' + error.message;
        this.loading = false;
        console.error(' Error:', error);
      }
    });
  }
  cargarEstadisticas() {
    this.http.get<any>(`${this.apiUrl}/estadisticas`).subscribe({
      next: (data) => {
        this.estadisticas = data;
        console.log('📊 Estadísticas cargadas:', data);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }


  cargarFiltros() {
    this.http.get<string[]>(`${this.apiUrl}/zonas-disponibles`).subscribe({
      next: (data) => {
        this.zonasDisponibles = data;
      }
    });

    this.http.get<string[]>(`${this.apiUrl}/meses-disponibles`).subscribe({
      next: (data) => {
        this.mesesDisponibles = data;
      }
    });
  }

  aplicarFiltros() {
    this.loading = true;
    this.error = '';
    
    let url = `${this.apiUrl}/todas`;
    
    if (this.filtroZona) {
      url = `${this.apiUrl}/por-zona/${this.filtroZona}`;
    } else if (this.filtroRegion) {
      url = `${this.apiUrl}/por-region/${this.filtroRegion}`;
    } else if (this.filtroMes) {
      this.filtrarPorMes();
      return;
    }

    this.http.get<VentaZona[]>(url).subscribe({
      next: (data) => {
        this.ventasZona = data;
        this.loading = false;
        console.log(`Filtro aplicado: ${data.length} registros`);
      },
      error: (error) => {
        this.error = 'Error al aplicar filtros: ' + error.message;
        this.loading = false;
      }
    });
  }

  filtrarPorMes() {
    if (!this.filtroMes) {
      this.cargarVentasZona();
      return;
    }

    this.loading = true;
    this.http.get<VentaZona[]>(`${this.apiUrl}/todas`).subscribe({
      next: (data) => {
        this.ventasZona = data.filter(venta => venta.mes === this.filtroMes);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al filtrar por mes';
        this.loading = false;
      }
    });
  }

  limpiarFiltros() {
    this.filtroZona = '';
    this.filtroRegion = '';
    this.filtroMes = '';
    this.cargarVentasZona();
  }

  getZonasUnicas(): string[] {
    return [...new Set(this.ventasZona.map(v => v.zona))];
  }

  getTotalPorZona(zona: string): number {
    return this.ventasZona
      .filter(v => v.zona === zona)
      .reduce((sum, venta) => sum + venta.montoTotal, 0);
  }

  getVentasCountPorZona(zona: string): number {
    return this.ventasZona
      .filter(v => v.zona === zona)
      .reduce((sum, venta) => sum + venta.totalVentas, 0);
  }

  
  formatearMoneda(valor: number): string {
    return `Q${valor?.toFixed(2) || '0.00'}`;
  }

  formatearPorcentaje(valor: number): string {
    return `${valor?.toFixed(2) || '0.00'}%`;
  }

  
  getColorMonto(monto: number): string {
    if (monto > 1000) return 'bg-success';
    if (monto > 500) return 'bg-warning';
    return 'bg-info';
  }


  exportarAExcel() {
    const headers = ['Zona', 'Región', 'Sucursal', 'Mes', 'Total Ventas', 'Monto Total', 'Promedio', 'Clientes', 'Vendedores', '% Global'];
    const csvData = this.ventasZona.map(venta => [
      venta.zona,
      venta.region,
      venta.sucursal,
      venta.mesNombre,
      venta.totalVentas,
      this.formatearMoneda(venta.montoTotal),
      this.formatearMoneda(venta.promedioVenta),
      venta.clientesAtendidos,
      venta.vendedoresActivos,
      this.formatearPorcentaje(venta.porcentajeGlobal)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_por_zona_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}