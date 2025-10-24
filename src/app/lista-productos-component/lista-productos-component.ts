import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-lista-productos-component',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './lista-productos-component.html',
  styleUrl: './lista-productos-component.scss'
})
export class ListaProductosComponent implements OnInit {
  productos: any[] = [];
  productoEditando: any = null;
  modoEdicion: boolean = false;
  mostrarFormularioCrear: boolean = false;

  categorias: any[] = [];
  unidades: any[] = [];
  estados: any[] = [];

  nuevoProducto: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: null,
    unidad: null,
    precioCosto: 0,
    precioVenta: 0,
    stockMinimo: 0,
    estado: { id_estado: 1, nombre: 'ACTIVO', tipo_estado: 'GENERAL' }
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.buscarProductos();
    this.cargarCatalogos();
  }

  // Cargar catálogos desde la base de datos
  cargarCatalogos() {

    this.http.get<any[]>("http://localhost:8080/api/categorias")
      .subscribe(categorias => {
        this.categorias = categorias;
        console.log('Categorías cargadas:', categorias);
      });

    // Cargar unidades
    this.http.get<any[]>("http://localhost:8080/api/unidades")
      .subscribe(unidades => {
        this.unidades = unidades;
        console.log('Unidades cargadas:', unidades);
      });

    // Cargar estados (opcional)
    this.http.get<any[]>("http://localhost:8080/api/estados")
      .subscribe(estados => {
        this.estados = estados;
        console.log('Estados cargados:', estados);
      });
  }

  buscarProductos() {
    this.servicioBuscarProductos().subscribe(
      (productos: any[]) => {
        this.productos = productos;
        console.log('Productos cargados:', productos);
      }
    );
  }

  servicioBuscarProductos(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8080/api/productos")
      .pipe(catchError(error => {
        console.error('Error cargando productos:', error);
        return of([]);
      }));
  }

  // Crear nuevo producto - MEJORADO
  crearProducto() {
    let formularioValido: any = document.getElementById("productoForm");
    if (formularioValido.reportValidity()) {
      console.log(' Intentando crear producto...');
      console.log(' Datos del producto:', this.nuevoProducto);
      
      this.servicioCrearProducto().subscribe(
        (response: any) => {
          console.log('Respuesta del servidor:', response);
          this.validarCreacion(response);
        },
        (error: any) => {
          console.error(' Error en la suscripción:', error);
          console.error(' Error details:', error.error);
          alert("Error de conexión al crear producto: " + error.message);
        }
      );
    }
  }

  servicioCrearProducto() {
    // Asegurarnos de que el producto tenga la estructura correcta
    const productoParaEnviar = {
      ...this.nuevoProducto,
      estado: this.nuevoProducto.estado || { id_estado: 1 }
    };

    console.log(' Enviando producto al backend:', productoParaEnviar);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>("http://localhost:8080/api/productos", productoParaEnviar, httpOptions)
      .pipe(catchError(error => {
        console.error('Error creando producto:', error);
        console.error('Error completo:', error);
        return of(null);
      }));
  }

  validarCreacion(response: any) {
    if (response && response.idProducto) {
      alert(" Producto creado exitosamente");
      this.buscarProductos();
      this.cancelarCreacion();
    } else {
      alert(" Error al crear producto. Verifica la consola para más detalles.");
    }
  }

  // Eliminar producto
  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.servicioEliminarProducto(id).subscribe(
        (response: any) => this.validarEliminacion(response)
      );
    }
  }

  servicioEliminarProducto(id: number) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.delete<any>(`http://localhost:8080/api/productos/${id}`, httpOptions)
      .pipe(catchError(error => {
        console.error('Error eliminando producto:', error);
        return of(null);
      }));
  }

  validarEliminacion(response: any) {
    if (response === null) {
      alert("Producto eliminado exitosamente");
      this.buscarProductos();
    } else {
      alert("Error al eliminar producto");
    }
  }

  // Editar producto - ACTUALIZADO
  iniciarEdicion(producto: any) {
    this.productoEditando = { ...producto };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.productoEditando = null;
    this.modoEdicion = false;
  }

  guardarEdicion() {
    if (this.productoEditando) {
      console.log(' Guardando edición:', this.productoEditando);
      this.servicioActualizarProducto(this.productoEditando).subscribe(
        (response: any) => this.validarActualizacion(response)
      );
    }
  }

  servicioActualizarProducto(producto: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.put<any>(`http://localhost:8080/api/productos/${producto.idProducto}`, producto, httpOptions)
      .pipe(catchError(error => {
        console.error('Error actualizando producto:', error);
        return of(null);
      }));
  }

  validarActualizacion(response: any) {
    if (response && response.idProducto) {
      alert("Producto actualizado exitosamente");
      this.buscarProductos();
      this.cancelarEdicion();
    } else {
      alert("Error al actualizar producto");
    }
  }

  // Formulario de creación
  mostrarFormulario() {
    this.mostrarFormularioCrear = true;
  }

  cancelarCreacion() {
    this.mostrarFormularioCrear = false;
    this.nuevoProducto = {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: null,
      unidad: null,
      precioCosto: 0,
      precioVenta: 0,
      stockMinimo: 0,
      estado: { id_estado: 1, nombre: 'ACTIVO', tipo_estado: 'GENERAL' }
    };
  }

  volverInicio() {
    this.router.navigate(['/welcome']);
  }

  getEstadoTexto(estado: any): string {
    if (typeof estado === 'object' && estado.id_estado) {
      return estado.id_estado === 1 ? 'Activo' : 'Inactivo';
    }
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClase(estado: any): string {
    const estadoId = typeof estado === 'object' && estado.id_estado ? estado.id_estado : estado;
    return estadoId === 1 ? 'badge-estado activo' : 'badge-estado inactivo';
  }

  // Calcular automáticamente precio de venta con margen
  calcularPrecioVenta() {
    if (this.nuevoProducto.precioCosto > 0) {
      const margen = 0.3; // 30% de margen
      this.nuevoProducto.precioVenta = this.nuevoProducto.precioCosto * (1 + margen);
    }
  }

  // Para edición
  calcularPrecioVentaEdicion() {
    if (this.productoEditando?.precioCosto > 0) {
      const margen = 0.3; // 30% de margen
      this.productoEditando.precioVenta = this.productoEditando.precioCosto * (1 + margen);
    }
  }

  // Método auxiliar para comparar objetos en los selects
  compararObjetos(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.idCategoria === o2.idCategoria || o1.idUnidad === o2.idUnidad : o1 === o2;
  }
}