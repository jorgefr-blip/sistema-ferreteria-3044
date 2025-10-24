import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-compras-component',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './compras-component.html',
  styleUrl: './compras-component.scss'
})
export class ComprasComponent implements OnInit {
  compras: any[] = [];
  compraEditando: any = null;
  detallesCompraEditando: any[] = [];
  modoEdicion: boolean = false;
  mostrarFormularioCrear: boolean = false;

  
  proveedores: any[] = [];
  sucursales: any[] = [];
  productos: any[] = [];
  estados: any[] = [];

  nuevaCompra: any = {
    proveedor: null,
    sucursal: null,
    fecha: new Date().toISOString().slice(0, 19), 
    total: 0,
    estado: { id_estado: 1, nombre: 'ACTIVO', tipo_estado: 'GENERAL' }
  };

  productoSeleccionado: any = null;
  cantidad: number = 1;
  precio: number = 0;
  detallesTemporales: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.buscarCompras();
    this.cargarCatalogos();
  }

  cargarCatalogos() {
  
    this.http.get<any[]>("http://localhost:8080/api/proveedores")
      .subscribe(proveedores => {
        this.proveedores = proveedores;
      });

    
    this.http.get<any[]>("http://localhost:8080/api/sucursales")
      .subscribe(sucursales => {
        this.sucursales = sucursales;
      });


    this.http.get<any[]>("http://localhost:8080/api/productos")
      .subscribe(productos => {
        this.productos = productos;
      });


    this.http.get<any[]>("http://localhost:8080/api/estados")
      .subscribe(estados => {
        this.estados = estados;
      });
  }

  buscarCompras() {
    this.servicioBuscarCompras().subscribe(
      (compras: any[]) => {
        this.compras = compras;
      }
    );
  }

  servicioBuscarCompras(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8080/api/compras")
      .pipe(catchError(error => {
        console.error('Error cargando compras:', error);
        return of([]);
      }));
  }

  // Cargar detalles de una compra específica
  cargarDetallesCompra(idCompra: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/detalles-compra/compra/${idCompra}`)
      .pipe(catchError(error => {
        console.error('Error cargando detalles:', error);
        return of([]);
      }));
  }

  // Agregar producto al detalle temporal
  agregarProducto() {
    if (this.productoSeleccionado && this.cantidad > 0 && this.precio >= 0) {
      const subtotal = this.cantidad * this.precio;
      
      const detalle = {
        producto: this.productoSeleccionado,
        cantidad: this.cantidad,
        precio: this.precio,
        subtotal: subtotal
      };

      this.detallesTemporales.push(detalle);
      this.calcularTotal();
      
      this.productoSeleccionado = null;
      this.cantidad = 1;
      this.precio = 0;
    } else {
      alert('Por favor complete todos los campos del producto');
    }
  }

  eliminarProductoDetalle(index: number) {
    this.detallesTemporales.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.nuevaCompra.total = this.detallesTemporales.reduce(
      (total: number, detalle: any) => total + detalle.subtotal, 0
    );
  }

  onProductoSeleccionado() {
    if (this.productoSeleccionado) {
      this.precio = this.productoSeleccionado.precioCosto || 0;
    }
  }

  crearCompra() {
    let formularioValido: any = document.getElementById("compraForm");
    
    if (formularioValido.reportValidity()) {
      if (this.detallesTemporales.length === 0) {
        alert('Debe agregar al menos un producto a la compra');
        return;
      }

      if (!this.nuevaCompra.proveedor || !this.nuevaCompra.sucursal) {
        alert('Debe seleccionar un proveedor y una sucursal');
        return;
      }

      console.log(' Intentando crear compra...');
      console.log(' Datos de la compra:', this.nuevaCompra);
      console.log(' Fecha que se enviará:', this.nuevaCompra.fecha);
  
      this.servicioCrearCompra().subscribe(
        (compraCreada: any) => {
          if (compraCreada && compraCreada.idCompra) {
            console.log(' Compra creada, ahora creando detalles... ID:', compraCreada.idCompra);
  
            this.crearDetallesCompra(compraCreada.idCompra);
          } else {
            alert("Error al crear compra");
          }
        },
        (error: any) => {
          console.error(' Error creando compra:', error);
          console.error(' Error details:', error.error);
          alert("Error de conexión al crear compra: " + error.message);
        }
      );
    }
  }

  crearDetallesCompra(idCompra: number) {
    const detallesParaEnviar = this.detallesTemporales.map(detalle => ({
      compra: { idCompra: idCompra },
      producto: { idProducto: detalle.producto.idProducto },
      cantidad: detalle.cantidad,
      precio: detalle.precio,
      subtotal: detalle.subtotal
    }));

    console.log(' Enviando detalles:', detallesParaEnviar);

    let detallesCreados = 0;
    const totalDetalles = detallesParaEnviar.length;

    if (totalDetalles === 0) {
      alert("Compra creada exitosamente (sin detalles)");
      this.buscarCompras();
      this.cancelarCreacion();
      return;
    }

    detallesParaEnviar.forEach(detalle => {
      this.servicioCrearDetalleCompra(detalle).subscribe(
        (response: any) => {
          detallesCreados++;
          console.log(` Detalle ${detallesCreados}/${totalDetalles} creado`);

          if (detallesCreados === totalDetalles) {
            alert("Compra y detalles creados exitosamente");
            this.buscarCompras();
            this.cancelarCreacion();
          }
        },
        (error: any) => {
          console.error(' Error creando detalle:', error);
          detallesCreados++;
        
          if (detallesCreados === totalDetalles) {
            alert(" Compra creada, pero hubo errores en algunos detalles");
            this.buscarCompras();
            this.cancelarCreacion();
          }
        }
      );
    });
  }

  servicioCrearCompra() {
    const compraParaEnviar = {
      ...this.nuevaCompra,
      estado: this.nuevaCompra.estado || { id_estado: 1 }
    };

    console.log(' Enviando compra al backend:', compraParaEnviar);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>("http://localhost:8080/api/compras", compraParaEnviar, httpOptions)
      .pipe(catchError(error => {
        console.error(' Error creando compra:', error);
        return of(null);
      }));
  }

  servicioCrearDetalleCompra(detalle: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>("http://localhost:8080/api/detalles-compra", detalle, httpOptions)
      .pipe(catchError(error => {
        console.error(' Error creando detalle:', error);
        return of(null);
      }));
  }

  // Eliminar compra
  eliminarCompra(id: number) {
    if (confirm('¿Estás seguro de eliminar esta compra? También se eliminarán sus detalles.')) {
      this.servicioEliminarCompra(id).subscribe(
        (response: any) => this.validarEliminacion(response)
      );
    }
  }

  servicioEliminarCompra(id: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.delete<any>(`http://localhost:8080/api/compras/${id}`, httpOptions)
      .pipe(catchError(error => {
        console.error('Error eliminando compra:', error);
        return of(null);
      }));
  }

  validarEliminacion(response: any) {
    if (response === null) {
      alert("Compra eliminada exitosamente");
      this.buscarCompras();
    } else {
      alert("Error al eliminar compra");
    }
  }

  verDetalles(compra: any) {
    this.compraEditando = { ...compra };
    this.modoEdicion = true;

    this.cargarDetallesCompra(compra.idCompra).subscribe(
      (detalles: any[]) => {
        this.detallesCompraEditando = detalles;
        console.log('Detalles cargados:', detalles);
      }
    );
  }

  cancelarEdicion() {
    this.compraEditando = null;
    this.detallesCompraEditando = [];
    this.modoEdicion = false;
  }

  // Formulario de creación
  mostrarFormulario() {
    this.mostrarFormularioCrear = true;
  }

  cancelarCreacion() {
    this.mostrarFormularioCrear = false;
    this.nuevaCompra = {
      proveedor: null,
      sucursal: null,
      fecha: new Date().toISOString().slice(0, 19), // Mismo formato aquí
      total: 0,
      estado: { id_estado: 1, nombre: 'ACTIVO', tipo_estado: 'GENERAL' }
    };
    this.detallesTemporales = [];
    this.productoSeleccionado = null;
    this.cantidad = 1;
    this.precio = 0;
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


  compararObjetos(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.idProveedor === o2.idProveedor || 
                      o1.idSucursal === o2.idSucursal || 
                      o1.idProducto === o2.idProducto : o1 === o2;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }


  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);
  }
}