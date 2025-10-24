import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface Cliente {
  idCliente: number;
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  nit: string;
  email: string;
  idEstado: number;
}

interface Producto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  estado?: {
    id_estado: number;
    nombre: string;
    tipo_estado: string;
  };
}

interface MetodoPago {
  idMetodo: number;
  nombre: string;
  requiereReferencia: string;
}

interface ItemVenta {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-nueva-venta-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './nueva-venta-component.html',
  styleUrl: './nueva-venta-component.scss'
})
export class NuevaVentaComponent implements OnInit {
  venta = {
    items: [] as ItemVenta[],
    subtotal: 0,
    descuento: 0,
    total: 0,
    metodoPago: 'EFECTIVO',
    cliente: null as Cliente | null
  };

  terminoBusqueda: string = '';
  productoSeleccionado: Producto | null = null;
  cantidadSeleccionada: number = 1;
  clienteBusqueda: string = '';
  montoRecibido: number = 0;
  cambio: number = 0;

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  clientes: Cliente[] = [];
  metodosPago: MetodoPago[] = [];

  usuarioLogueado: any;
  sucursalActual = { 
    idSucursal: 1, 
    nombre: 'Sucursal Central' 
  };

  today: Date = new Date();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuarioStr = localStorage.getItem('currentUser');
    if (!usuarioStr) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioLogueado = JSON.parse(usuarioStr);
    
    // Verificar permisos
    if (!this.tienePermisoVentas()) {
      alert('No tienes permisos para acceder a esta sección');
      this.router.navigate(['/welcome']);
      return;
    }

    this.cargarMetodosPago();
    this.cargarClientes();
    this.cargarProductos();
  }

  private tienePermisoVentas(): boolean {
    if (!this.usuarioLogueado.roles) return false;
    const rolesPermitidos = ['Administrador', 'Jefe de Ventas', 'Vendedor'];
    return this.usuarioLogueado.roles.some((rol: any) => rolesPermitidos.includes(rol.nombre));
  }

  cargarMetodosPago(): void {
    this.http.get<MetodoPago[]>('http://localhost:8080/api/metodos-pago')
      .subscribe({
        next: (metodos) => {
          this.metodosPago = metodos;
        },
        error: (error) => {
          console.error('Error cargando métodos de pago:', error);
          alert('Error al cargar métodos de pago');
        }
      });
  }

  cargarClientes(): void {
    this.http.get<Cliente[]>('http://localhost:8080/api/clientes')
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
        },
        error: (error) => {
          console.error('Error cargando clientes:', error);
          alert('Error al cargar clientes');
        }
      });
  }

  cargarProductos(): void {
    this.http.get<Producto[]>('http://localhost:8080/api/productos')
      .subscribe({
        next: (productos) => {
          this.productos = productos;
          this.productosFiltrados = productos;
        },
        error: (error) => {
          console.error('Error cargando productos:', error);
          alert('Error al cargar productos');
        }
      });
  }

  filtrarProductos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      p.codigo.toLowerCase().includes(termino) ||
      p.descripcion.toLowerCase().includes(termino)
    );
  }

  seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.terminoBusqueda = `${producto.codigo} - ${producto.nombre}`;
  }

  agregarProductoSeleccionado(): void {
    if (!this.productoSeleccionado) {
      alert('Selecciona un producto primero');
      return;
    }
    this.agregarProducto(this.productoSeleccionado);
  }

  agregarProducto(producto: Producto): void {
    if (producto.estado && producto.estado.id_estado !== 1) {
      alert('Este producto está INACTIVO y no se puede vender');
      return;
    }

    const itemExistente = this.venta.items.find(item => 
      item.producto.idProducto === producto.idProducto
    );

    if (itemExistente) {
      itemExistente.cantidad += this.cantidadSeleccionada;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      const nuevoItem: ItemVenta = {
        producto: producto,
        cantidad: this.cantidadSeleccionada,
        precioUnitario: producto.precioVenta,
        subtotal: this.cantidadSeleccionada * producto.precioVenta
      };
      this.venta.items.push(nuevoItem);
    }

    this.calcularTotales();
    this.limpiarBusqueda();
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.productoSeleccionado = null;
    this.productosFiltrados = this.productos;
    this.cantidadSeleccionada = 1;
  }

  buscarCliente(): void {
    if (!this.clienteBusqueda.trim()) {
      alert('Ingresa un nombre o NIT de cliente');
      return;
    }

    const clienteEncontrado = this.clientes.find(c => 
      c.nombre.toLowerCase().includes(this.clienteBusqueda.toLowerCase()) ||
      c.apellido.toLowerCase().includes(this.clienteBusqueda.toLowerCase()) ||
      c.nit.toLowerCase().includes(this.clienteBusqueda.toLowerCase())
    );

    if (clienteEncontrado) {
      this.venta.cliente = clienteEncontrado;
    } else {
      alert('Cliente no encontrado');
    }
  }

  crearClienteRapido(): void {
    const nombre = prompt('Nombre del nuevo cliente:');
    if (!nombre || !nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    const apellido = prompt('Apellido del nuevo cliente:') || '';
    const nit = prompt('NIT del nuevo cliente :');
    if (!nit || !nit.trim()) {
      alert('El NIT es requerido');
      return;
    }

    const telefono = prompt('Teléfono del nuevo cliente:') || '';
    const email = prompt('Email del nuevo cliente :') || '';
    const direccion = prompt('Dirección del nuevo cliente :') || '';

    const nuevoCliente = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      nit: nit.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      email: email.trim(),
      idEstado: 1
    };

    this.http.post<Cliente>('http://localhost:8080/api/clientes', nuevoCliente)
      .subscribe({
        next: (clienteCreado) => {
          this.clientes.push(clienteCreado);
          this.venta.cliente = clienteCreado;
          this.clienteBusqueda = `${clienteCreado.nombre} ${clienteCreado.apellido}`;
          alert(' Cliente creado exitosamente');
        },
        error: (error) => {
          console.error('Error creando cliente:', error);
          alert('Error al crear cliente');
        }
      });
  }

  calcularTotales(): void {
    this.venta.subtotal = this.venta.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.venta.total = this.venta.subtotal - this.venta.descuento;
    if (this.venta.metodoPago === 'EFECTIVO') this.calcularCambio();
  }

  calcularCambio(): void {
    this.cambio = this.montoRecibido > 0 ? this.montoRecibido - this.venta.total : 0;
  }

  actualizarCantidad(item: ItemVenta): void {
    if (item.cantidad < 1) item.cantidad = 1;
    item.subtotal = item.cantidad * item.precioUnitario;
    this.calcularTotales();
  }

  eliminarItem(index: number): void {
    this.venta.items.splice(index, 1);
    this.calcularTotales();
  }

  reiniciarVenta(): void {
    this.venta = {
      items: [],
      subtotal: 0,
      descuento: 0,
      total: 0,
      metodoPago: 'EFECTIVO',
      cliente: null
    };
    this.limpiarBusqueda();
    this.montoRecibido = 0;
    this.cambio = 0;
    this.clienteBusqueda = '';
  }

  cancelarVenta(): void {
    if (confirm('¿Estás seguro de cancelar esta venta?')) {
      this.reiniciarVenta();
    }
  }

  finalizarVenta(): void {
  if (!this.validarVenta()) return;

  
  const ventaData = {
    numero: 'F-' + Date.now(), 
    cliente: { idCliente: this.venta.cliente!.idCliente },
    vendedor: { idUsuario: this.usuarioLogueado.idUsuario },
    sucursal: { idSucursal: this.sucursalActual.idSucursal },
    fecha: new Date().toISOString(),
    total: this.venta.total,
    estado: { id_estado: 1 },
    
    detalles: this.venta.items.map(item => ({
      producto: { idProducto: item.producto.idProducto },
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal
    }))
  };

  console.log(' Enviando al backend:', ventaData);

  this.http.post('http://localhost:8080/api/facturas', ventaData)
    .subscribe({
      next: (response: any) => {
        console.log(' Respuesta del backend:', response);
        alert(` Venta finalizada exitosamente\nNúmero de factura: ${response.numero}`);
        this.reiniciarVenta();
      },
      error: (error) => {
        console.error(' Error:', error);
        alert(' Error al finalizar venta: ' + (error.error?.message || error.message));
      }
    });
}

  validarVenta(): boolean {
    if (!this.venta.items.length) {
      alert('No hay productos en el ticket');
      return false;
    }
    if (!this.venta.cliente) {
      alert('Selecciona un cliente');
      return false;
    }
    if (this.venta.metodoPago === 'EFECTIVO' && this.montoRecibido < this.venta.total) {
      alert('El monto recibido es menor al total');
      return false;
    }
    return true;
  }

  volverInicio(): void {
    this.router.navigate(['/welcome']);
  }
}