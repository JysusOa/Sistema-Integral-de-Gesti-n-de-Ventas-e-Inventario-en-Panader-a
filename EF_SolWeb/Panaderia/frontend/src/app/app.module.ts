import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
//import { PedidosComponent } from './pedidos/pedidos.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
//import { StoreModule } from '@ngrx/store';
//import { SocketIoModule } from 'ngx-socket-io';

@NgModule({

imports: [
  CommonModule,
  NgxMatSelectSearchModule,
  MatAutocompleteModule,
  BrowserAnimationsModule,
  MatDialogModule
  ]
})
export class AppModule { }
