import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Reporte {
  id: string; // ⭐ NUEVO: Necesario para eliminar
  titulo: string;
  fecha: string;
  estado: string;
  icon: string;
  detalles?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private STORAGE_KEY = 'pan_francisco_reportes_v2';

  // Datos iniciales con IDs
  private initialData: Reporte[] = [
    { id: '1', titulo: 'Reporte de Mermas', fecha: '02/12/2025', estado: 'Pendiente', icon: 'delete_outline' },
    { id: '2', titulo: 'Control de Calidad Diario', fecha: '01/12/2025', estado: 'Aprobado', icon: 'verified' },
    { id: '3', titulo: 'Auditoría de Insumos', fecha: '28/11/2025', estado: 'Revisión', icon: 'inventory' }
  ];

  private reportesSubject = new BehaviorSubject<Reporte[]>([]);
  reportes$ = this.reportesSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.reportesSubject.next(JSON.parse(saved));
    } else {
      this.reportesSubject.next(this.initialData);
    }
  }

  // ⭐ Agregar con ID único (Soluciona el límite)
  addReport(reporte: Omit<Reporte, 'id'>) {
    const currentReports = this.reportesSubject.value;

    const newReport: Reporte = {
      ...reporte,
      id: Date.now().toString() // Genera ID único basado en la hora milimétrica
    };

    const updatedReports = [newReport, ...currentReports];
    this.updateState(updatedReports);
  }

  // ⭐ Función Eliminar
  deleteReport(id: string) {
    const currentReports = this.reportesSubject.value;
    const updatedReports = currentReports.filter(r => r.id !== id);
    this.updateState(updatedReports);
  }

  // Guardar centralizado
  private updateState(reports: Reporte[]) {
    this.reportesSubject.next(reports);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
  }
}
