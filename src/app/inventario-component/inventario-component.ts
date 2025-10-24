import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-inventario-component',
  imports: [CommonModule],
  templateUrl: './inventario-component.html',
  styleUrl: './inventario-component.scss'
})
export class InventarioComponent implements OnInit {
  inventario: any[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarInventario();
  }

  cargarInventario() {
    this.loading = true;
    this.http.get<any[]>("http://localhost:8080/api/inventarios")
      .pipe(catchError(error => {
        console.error('Error cargando inventario:', error);
        return of([]);
      }))
      .subscribe(inventario => {
        this.inventario = inventario;
        this.loading = false;
        console.log('Inventario cargado:', inventario);
      });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No actualizado';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  getNivelStockClase(cantidad: number, stockMinimo: number): string {
    if (cantidad === 0) return 'bg-danger text-white';
    if (cantidad <= stockMinimo) return 'bg-warning text-dark';
    return 'bg-success text-white';
  }

  getNivelStockTexto(cantidad: number, stockMinimo: number): string {
    if (cantidad === 0) return 'Sin Stock';
    if (cantidad <= stockMinimo) return 'Stock Bajo';
    return 'Stock Normal';
  }

  recargarInventario() {
    this.cargarInventario();
  }
}