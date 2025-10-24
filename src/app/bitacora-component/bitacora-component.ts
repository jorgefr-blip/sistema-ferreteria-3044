import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Bitacora {
  idLog: number;
  tablaAfectada: string;
  pkAfectada: string;
  accion: string;
  usuarioBd: string;
  fechaHora: string;
  detalle: string;
  
  usuario?: {
    idUsuario: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './bitacora-component.html',
  styleUrls: ['./bitacora-component.scss'] // ✅ corregido: era "styleUrl"
})
export class BitacoraComponent implements OnInit {
  bitacoras: Bitacora[] = [];
  bitacorasFiltradas: Bitacora[] = [];
  loading = false;
  error = '';
Math = Math;

  // Filtros
  filtros = {
    tabla: '',
    accion: '',
    fechaInicio: '',
    fechaFin: '',
    usuarioBd: '',
    searchText: ''
  };

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Opciones para filtros
  tablasUnicas: string[] = [];
  accionesUnicas: string[] = ['I', 'U', 'D'];
  usuariosUnicos: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarBitacora();
  }

cargarBitacora() {
  this.loading = true;
  this.error = '';

  console.log('🔄 Iniciando carga de bitácora...');

  // Usa el HttpClient con manejo de errores mejorado
  this.http.get<Bitacora[]>('http://localhost:8080/api/bitacora')
    .subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos:', data);
        this.bitacoras = data || [];
        this.bitacorasFiltradas = [...this.bitacoras];
        this.extraerOpcionesFiltros();
        this.loading = false;
        
        console.log(`📊 ${this.bitacoras.length} registros cargados`);
      },
      error: (error) => {
        console.error('❌ Error completo:', error);
        
        if (error.status === 0) {
          this.error = 'Error de conexión: No se pudo conectar al servidor. Verifica que el backend esté ejecutándose en http://localhost:8080';
        } else if (error.status === 404) {
          this.error = 'Endpoint no encontrado. Verifica la URL del API.';
        } else {
          this.error = `Error ${error.status}: ${error.message}`;
        }
        
        this.loading = false;
        this.bitacoras = [];
        this.bitacorasFiltradas = [];
      }
    });
}

  extraerOpcionesFiltros() {
    // Extraer tablas únicas
    this.tablasUnicas = [...new Set(this.bitacoras.map(b => b.tablaAfectada))].sort();

    // Extraer usuarios únicos
    this.usuariosUnicos = [...new Set(this.bitacoras.map(b => b.usuarioBd).filter(b => b))].sort();
  }

  aplicarFiltros() {
    let filtradas = [...this.bitacoras];

    if (this.filtros.tabla) {
      filtradas = filtradas.filter(b =>
        b.tablaAfectada.toLowerCase().includes(this.filtros.tabla.toLowerCase())
      );
    }

    if (this.filtros.accion) {
      filtradas = filtradas.filter(b => b.accion === this.filtros.accion);
    }

    if (this.filtros.usuarioBd) {
      filtradas = filtradas.filter(b =>
        b.usuarioBd?.toLowerCase().includes(this.filtros.usuarioBd.toLowerCase())
      );
    }

    if (this.filtros.fechaInicio) {
      const fechaInicio = new Date(this.filtros.fechaInicio);
      filtradas = filtradas.filter(b => new Date(b.fechaHora) >= fechaInicio);
    }

    if (this.filtros.fechaFin) {
      const fechaFin = new Date(this.filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(b => new Date(b.fechaHora) <= fechaFin);
    }

    if (this.filtros.searchText) {
      const searchLower = this.filtros.searchText.toLowerCase();
      filtradas = filtradas.filter(b =>
        b.tablaAfectada.toLowerCase().includes(searchLower) ||
        b.pkAfectada.toLowerCase().includes(searchLower) ||
        b.detalle.toLowerCase().includes(searchLower) ||
        b.usuarioBd?.toLowerCase().includes(searchLower) ||
        b.accion.toLowerCase().includes(searchLower)
      );
    }

    this.bitacorasFiltradas = filtradas;
    this.currentPage = 1;
    this.totalItems = filtradas.length;
  }

  limpiarFiltros() {
    this.filtros = {
      tabla: '',
      accion: '',
      fechaInicio: '',
      fechaFin: '',
      usuarioBd: '',
      searchText: ''
    };
    this.aplicarFiltros();
  }

  // 🔹 Paginación
  get bitacorasPaginadas(): Bitacora[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.bitacorasFiltradas.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }

  get paginasParaMostrar(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // 🔹 Utilidades
  getAccionTexto(accion: string): string {
    const acciones: { [key: string]: string } = {
      'I': 'CREACIÓN',
      'U': 'ACTUALIZACIÓN',
      'D': 'ELIMINACIÓN'
    };
    return acciones[accion] || accion;
  }

  getAccionClase(accion: string): string {
    const clases: { [key: string]: string } = {
      'I': 'badge-creacion',
      'U': 'badge-actualizacion',
      'D': 'badge-eliminacion'
    };
    return clases[accion] || 'badge-default';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES');
  }

  exportarCSV() {
    const headers = ['ID', 'Tabla', 'Acción', 'PK Afectada', 'Usuario BD', 'Fecha/Hora', 'Detalle'];
    const csvData = this.bitacorasFiltradas.map(bitacora => [
      bitacora.idLog,
      `"${bitacora.tablaAfectada}"`,
      bitacora.accion,
      `"${bitacora.pkAfectada}"`,
      `"${bitacora.usuarioBd || ''}"`,
      `"${this.formatearFecha(bitacora.fechaHora)}"`,
      `"${bitacora.detalle.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bitacora_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
