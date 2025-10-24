import { Routes } from '@angular/router';
import { Login } from './login/login';
import { BienvenidaComponent } from './bienvenida-component/bienvenida-component';
import { NuevaVentaComponent } from './nueva-venta-component/nueva-venta-component';
import { ListaClientesComponent } from './lista-clientes-component/lista-clientes-component';
import { ListaUsuariosComponent } from './lista-usuarios-component/lista-usuarios-component';
import { ListaProductosComponent } from './lista-productos-component/lista-productos-component';
import { ComprasComponent } from './compras-component/compras-component';
import { InventarioComponent } from './inventario-component/inventario-component';
import { ListaFacturasComponent } from './lista-facturas-component/lista-facturas-component';
import { ProveedoresComponent } from './proveedores-component/proveedores-component';
import { TopClientesComponent } from './top-clientes-component/top-clientes-component';
import { TopVendedoresComponent } from './top-vendedores-component/top-vendedores-component';
import { VentasZonaComponent } from './ventas-zona-component/ventas-zona-component';
import { BitacoraComponent } from './bitacora-component/bitacora-component';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'welcome', component: BienvenidaComponent },
  { path: 'ventas', component: NuevaVentaComponent },
  { path: 'listaClientes', component: ListaClientesComponent },
  { path: 'listaUsuarios', component: ListaUsuariosComponent },
  { path: 'listaProductos', component: ListaProductosComponent },
  { path : 'compras', component: ComprasComponent },
  { path : 'inventario', component: InventarioComponent },
  { path : 'listaFacturas', component: ListaFacturasComponent },
  { path : 'proveedores', component: ProveedoresComponent },
  {path: 'reportes/top-clientes', component: TopClientesComponent},
  {path: 'reportes/top-vendedores', component: TopVendedoresComponent},
  {path : 'reportes/ventas-zona', component: VentasZonaComponent},
  {path : 'bitacora', component: BitacoraComponent},
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];