import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface OpcionMenu {
  idOpcionMenu: number;
  nombreOpcion: string;
  descripcion: string;
  ruta?: string;
  icono?: string;
}

export interface Menu {
  idMenu: number;
  opcionMenu: string;
  opcionesMenu: OpcionMenu[];
}

@Component({
  selector: 'app-bienvenida-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bienvenida-component.html',
  styleUrl: './bienvenida-component.scss'
})
export class BienvenidaComponent implements OnInit {
  usuarioLogueado: any;
  menus: Menu[] = [];
  loadingMenus = true;
  today: Date = new Date();


  private rutasMap: { [key: string]: string } = {
    'Usuarios': '/listaUsuarios',
    'Sucursales': '/sucursales',
    'Nueva Venta': '/ventas',
    'Notas de Crédito': '/notas-credito',
    'Cuentas por Cobrar': '/cuentas-cobrar',
    'Consultar Stock': '/inventario',
    'Productos': '/listaProductos',
    'Nueva Compra': '/compras',
    'Proveedores': '/proveedores',
    'Gestión de Proveedores': '/proveedores', 
    'Registrar Cliente': '/registrar-cliente',
    'Consultar Clientes': '/listaClientes',
    'Top Clientes': '/reportes/top-clientes',
    'Top Vendedores': '/reportes/top-vendedores',
    'Ventas por Zona': '/reportes/ventas-zona'
  };


  private iconosMap: { [key: string]: string } = {
    'Usuarios': 'fas fa-users',
    'Sucursales': 'fas fa-store',
    'Nueva Venta': 'fas fa-cash-register',
    'Notas de Crédito': 'fas fa-file-invoice-dollar',
    'Cuentas por Cobrar': 'fas fa-hand-holding-usd',
    'Consultar Stock': 'fas fa-boxes',
    'Productos': 'fas fa-box-open',
    'Nueva Compra': 'fas fa-shopping-cart',
    'Proveedores': 'fas fa-truck',
    'Gestión de Proveedores': 'fas fa-truck-loading', 
    'Registrar Cliente': 'fas fa-user-plus',
    'Consultar Clientes': 'fas fa-address-book',
    'Top Clientes': 'fas fa-trophy',
    'Top Vendedores': 'fas fa-chart-line',
    'Ventas por Zona': 'fas fa-map-marked-alt'
  };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const usuarioStr = localStorage.getItem('currentUser');
    if (!usuarioStr) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.usuarioLogueado = JSON.parse(usuarioStr);
    console.log('Usuario logueado:', this.usuarioLogueado);
    
    this.cargarMenusDesdeBaseDeDatos();
  }

  cargarMenusDesdeBaseDeDatos() {
    const idUsuario = this.usuarioLogueado.idUsuario;
    
    if (!idUsuario) {
      console.error(' No se encontró idUsuario en el usuario logueado');
      this.mostrarErrorMenus();
      return;
    }

    const url = `http://localhost:8080/api/menus/usuario/${idUsuario}/completo`;
    
    console.log('solicitando menús desde BD para usuario ID:', idUsuario);
    
    this.http.get<Menu[]>(url)
      .subscribe({
        next: (menusDesdeBD) => {
          console.log(' Menús cargados desde BASE DE DATOS:', menusDesdeBD);
          
          if (menusDesdeBD && menusDesdeBD.length > 0) {
            this.menus = this.enriquecerMenus(menusDesdeBD);
            console.log(' Menús enriquecidos desde BD:', this.menus);
          } else {
            console.warn(' El usuario no tiene menús asignados en la BD');
            this.mostrarSinMenus();
          }
          
          this.loadingMenus = false;
        },
        error: (error) => {
          console.error(' Error cargando menús desde BD:', error);
          this.mostrarErrorCarga();
          this.loadingMenus = false;
        }
      });
  }

  private enriquecerMenus(menus: Menu[]): Menu[] {
    return menus.map(menu => ({
      ...menu,
      opcionesMenu: menu.opcionesMenu.map(opcion => ({
        ...opcion,
        ruta: this.rutasMap[opcion.nombreOpcion] || '/welcome',
        icono: this.iconosMap[opcion.nombreOpcion] || 'fas fa-cog'
      }))
    }));
  }

  private mostrarSinMenus() {
    this.menus = [];
  }

  private mostrarErrorCarga() {
    this.menus = [];
  }

  private mostrarErrorMenus() {
    this.menus = [];
  }

  navegarARuta(ruta: string) {
    console.log(' Navegando a:', ruta);
    this.router.navigate([ruta])
      .then(() => console.log(' Navegación exitosa a:', ruta))
      .catch(error => console.error('Error navegando a', ruta, ':', error));
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getNombreUsuario(): string {
    return this.usuarioLogueado?.nombre || 'Usuario';
  }

  getRolesUsuario(): string {
    if (!this.usuarioLogueado?.roles) return 'Sin roles';
    return this.usuarioLogueado.roles.map((rol: any) => rol.nombre).join(', ');
  }
}
