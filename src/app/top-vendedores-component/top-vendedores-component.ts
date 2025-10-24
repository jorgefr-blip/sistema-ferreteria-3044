// src/app/components/top-vendedores-component/top-vendedores-component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TopVendedor {
  idUsuario: number;
  idRegion: number;
  region: string;
  zona: string;
  vendedor: string;
  correo: string;
  sucursal: string;
  totalVentas: number;
  totalVentasMonto: number;
  promedioVenta: number;
  ventaMinima: number;
  ventaMaxima: number;
  clientesAtendidos: number;
  porcentajeRegion: number;
}

@Component({
  selector: 'app-top-vendedores',
  imports: [CommonModule,FormsModule],
  templateUrl: './top-vendedores-component.html',
  styleUrls: ['./top-vendedores-component.scss']
})
export class TopVendedoresComponent implements OnInit {
  
  topVendedores: TopVendedor[] = [];
  loading = true;
  error = '';
  

  filtroZona: string = '';
  filtroRegion: string = '';
  
  
  estadisticas: any = {};

  private apiUrl = 'http://localhost:8080/api/reportes/top-vendedores';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarTopVendedores();
    this.cargarEstadisticas();
  }

  cargarTopVendedores() {
    this.loading = true;
    this.error = '';
    
    this.http.get<TopVendedor[]>(`${this.apiUrl}/global`).subscribe({
      next: (data) => {
        this.topVendedores = data;
        this.loading = false;
        console.log('✅ Vendedores cargados:', data.length);
      },
      error: (error) => {
        this.error = 'Error al cargar los vendedores: ' + error.message;
        this.loading = false;
        console.error('❌ Error:', error);
      }
    });
  }

  cargarEstadisticas() {
    this.http.get<any>(`${this.apiUrl}/estadisticas`).subscribe({
      next: (data) => {
        this.estadisticas = data;
        console.log('Estadísticas cargadas:', data);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  aplicarFiltros() {
    this.loading = true;
    this.error = '';
    
    let url = `${this.apiUrl}/global`;
    
    if (this.filtroZona) {
      url = `${this.apiUrl}/por-zona/${this.filtroZona}`;
    } else if (this.filtroRegion) {
      url = `${this.apiUrl}/por-region/${this.filtroRegion}`;
    }

    this.http.get<TopVendedor[]>(url).subscribe({
      next: (data) => {
        this.topVendedores = data;
        this.loading = false;
        console.log(` Filtro aplicado: ${data.length} vendedores`);
      },
      error: (error) => {
        this.error = 'Error al aplicar filtros: ' + error.message;
        this.loading = false;
      }
    });
  }


  limpiarFiltros() {
    this.filtroZona = '';
    this.filtroRegion = '';
    this.cargarTopVendedores();
  }

  formatearMoneda(valor: number): string {
    return `Q${valor?.toFixed(2) || '0.00'}`;
  }

  formatearPorcentaje(valor: number): string {
    return `${valor?.toFixed(2) || '0.00'}%`;
  }

  getRendimientoColor(porcentaje: number): string {
    if (porcentaje > 25) return 'bg-success';
    if (porcentaje > 15) return 'bg-warning';
    return 'bg-info';
  }
}