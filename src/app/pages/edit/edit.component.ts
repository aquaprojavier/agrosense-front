import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { PropertyService } from 'src/app/core/services/property.service';
import { DataService } from 'src/app/core/services/data.service';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from 'src/app/core/models/device.models';
import { Operation } from '../../core/models/operation.models';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';
import { Router } from '@angular/router';
import { DeviceService } from 'src/app/core/services/device.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditComponent implements OnInit {

  timeWithoutConexion: number = 2 * 60 * 60 * 1000;
  actualDate: Date = new Date();
  argentinaTimezoneOffset = -3; // GMT-3
  actualDateInArgentina: Date = new Date(this.actualDate.getTime() + this.argentinaTimezoneOffset * 60 * 60 * 1000);
  operations: Operation[];
  propId: number;
  devices: Device[];
  areSerialNumbersAvailable: boolean

  constructor(
    private operationService: OperationService,
    private deviceService: DeviceService,
    private dataService: DataService,
    private propertyService: PropertyService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['id'];
      this.areFreeSerialNumbers("draginonestor");
      this.getData(this.propId)
    },
      (error) => {
        console.log(error);
      }
    )
  }

  areFreeSerialNumbers(serialId: string){
    this.dataService.getSerialNumber(serialId).subscribe(data => {
      if (data.length === 0){
        this.areSerialNumbersAvailable = false
      } else {
        this.areSerialNumbersAvailable = true
      }
    });
  }

  createDevice() {
    if (!this.areSerialNumbersAvailable) {
      Swal.fire({
        icon: 'error',
        title: 'No se pueden crear más dispositivos',
        text: '¡No hay nuevos dispositivos instalados en el campo que usted pueda vincular!',
        customClass: {
          popup: 'dark-background',
          title: 'dark-background swal2-title',
          htmlContainer: 'dark-background swal2-content',
        },
        didOpen: () => {
          const modal = Swal.getPopup();
          modal.style.setProperty('border-color', '#ffffff'); /* Color de borde */
        },
      });
    } else {
      this.router.navigate(['/form/create-device', this.propId]);
    }
  }

  deleteDevice(id: number) {
    this.deviceService.deleteDevice(id).subscribe(
      (response: string) => {
        // La solicitud se completó con éxito
        console.log(response);
        Swal.fire({
          title: 'Eliminación exitosa!',
          text: 'El dispositivo fue eliminado correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 1000
        }).then(() => {
          location.reload();
        });
      },
      (error) => {
        // Ocurrió un error durante la solicitud
        console.error('Error al eliminar el dispositivo:', error);
        // Realizar cualquier otra acción necesaria en caso de error
      }
    );
  }  
  
  deleteOperation(id: number){
    this.operationService.deleteOperation(id).subscribe(
      (response: string) => {
        // La solicitud se completó con éxito
        console.log(response);
        Swal.fire({
          title: 'Eliminación exitosa!',
          text: 'La operación fue eliminada correctamente',
          icon: 'success',
          showConfirmButton: false,
          timer: 1000
        }).then(() => {
          location.reload();
        });
      },
      (error) => {
        // Ocurrió un error durante la solicitud
        console.error('Error al eliminar la operacion:', error);
        // Realizar cualquier otra acción necesaria en caso de error
      }
    );
  }

  getData(id: number){
    this.propertyService.getOperationAndDevicesByPropertyId(id).subscribe(data =>{
      this.operations = data;
      this.devices = [];
      this.operations.forEach(ope => {
        ope.devices.forEach(dev => {
          this.devices.push(dev);
          this.isConected(dev.devicesId).subscribe(conected => {
            dev.conected = conected;
          });
        })        
      });
    })
  }

  isConected(id: number): Observable<boolean> {
    return this.dataService.lastDataByDeviceId(id).pipe(
      map(data => {
        const lastConnection: Date = new Date(data.dataFecha.toLocaleString('en-US', { timeZone: 'UTC' }));
        // console.log("last " + lastConnection);
        // console.log("actual " + this.actualDateInArgentina);
        const millisecondDif: number = this.actualDateInArgentina.getTime() - lastConnection.getTime();
        // console.log("dif " + millisecondDif)
        // console.log("3hrs " + this.timeWithoutConexion);
        if (millisecondDif > this.timeWithoutConexion) {
          // console.log("false");
          return false;
        } else {
          // console.log("true");
          return true;
        }
      }),
      catchError(error => {
        console.log(error);
        return of(false);
      })
    );
  }

  getDevicesNames(devices: Device[]): string {
    const deviceNames = devices.map(dev => dev.devicesNombre);
    return deviceNames.length > 0 ? deviceNames.join(', ') : 'No tiene';
  }
  

}
