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
import { Property } from 'src/app/core/models/property.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditComponent implements OnInit {

  timeWithoutConexion: number = 480 * 60 * 60 * 1000;
  actualDate: Date = new Date();
  argentinaTimezoneOffset = -3; // GMT-3
  actualDateInArgentina: Date = new Date(this.actualDate.getTime() + this.argentinaTimezoneOffset * 60 * 60 * 1000);
  operations: Operation[];
  property: Property
  propId: number;
  devices: Device[];
  areSerialNumbersAvailable: boolean

  constructor(
    private sanitizer: DomSanitizer,
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

  areFreeSerialNumbers(serialId: string) {
    this.dataService.getSerialNumber(serialId).subscribe(data => {
      if (data.length === 0) {
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
    Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro de que deseas eliminar este dispositivo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirmó la eliminación, se realiza la solicitud DELETE
        this.deviceService.deleteDevice(id).subscribe(
          (response: string) => {
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
            console.error('Error al eliminar el dispositivo:', error);
            // Realizar cualquier otra acción necesaria en caso de error
          }
        );
      }
    });
  }

  deleteOperation(id: number) {
    Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro de que deseas eliminar esta operación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirmó la eliminación, se realiza la solicitud DELETE
        this.operationService.deleteOperation(id).subscribe(
          (response: string) => {
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
            console.error('Error al eliminar la operacion:', error);
            // Realizar cualquier otra acción necesaria en caso de error
          }
        );
      }
    });
  };

  getDeviceTypeImage(deviceType: string) {
    switch (deviceType) {
      case 'Suelo':
        return 'assets/images/root32px.png'; // Ruta de imagen para Tipo1
      case 'Temp.':
        return 'assets/images/temperature32.png'; // Ruta de imagen para Tipo2
      case 'Caudal':
        return 'assets/images/water-meter32.png'; // Ruta de imagen para Tipo2
      // Agrega más casos según sea necesario para otros tipos de dispositivos
      default:
        return 'assets/images/smart-farm64.png'; // Ruta de imagen por defecto
    }
  }

  getCoordinates(geojson: string): number[][][] | null {
    try {
      const parsedGeoJSON = JSON.parse(geojson);
      if (parsedGeoJSON && parsedGeoJSON.geometry.coordinates && parsedGeoJSON.geometry.coordinates.length > 0) {
        return parsedGeoJSON.geometry.coordinates;
      }
      return null;
    } catch (error) {
      console.error('Error parsing GeoJSON:', error);
      return null;
    }
  }

  // Función para obtener el SVG seguro
  getMiniaturaSegura(coordinates: number[][][]): SafeHtml {
    const svg = this.getMiniaturaPoligono(coordinates);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getMinMaxCoordinates(coordinates: number[][][]): [number, number, number, number] | null {
    if (coordinates && coordinates.length > 0) {
      const flattenCoordinates = coordinates.reduce((acc, val) => acc.concat(val), []);

      if (flattenCoordinates.length > 0) {
        const allXCoordinates = flattenCoordinates.map(point => point[0]);
        const allYCoordinates = flattenCoordinates.map(point => point[1]);

        const minX = Math.min(...allXCoordinates);
        const minY = Math.min(...allYCoordinates);
        const maxX = Math.max(...allXCoordinates);
        const maxY = Math.max(...allYCoordinates);

        return [minX, minY, maxX, maxY];
      }
    }
    return null;
  }

  getMiniaturaPoligono(coordinates: number[][][]): string {
    const svgWidth = 80;
    const svgHeight = 50;
    const scaleFactor = this.getScaleFactor(this.operations);
  
    if (coordinates && coordinates.length > 0) {
      const [minX, minY, maxX, maxY] = this.getMinMaxCoordinates(coordinates);
  
      const width = maxX - minX;
      const height = maxY - minY;
  
      const scaledWidth = width * scaleFactor;
      const scaledHeight = height * scaleFactor;
  
      const scaledCoordinates = coordinates[0].map(point => [
        (point[0] - minX) * scaleFactor + (svgWidth - scaledWidth) / 2, // Centrar horizontalmente
        (point[1] - minY) * scaleFactor + (svgHeight - scaledHeight) / 2 // Centrar verticalmente
      ]);
  
      const pathData = scaledCoordinates
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.join(',')}`)
        .join(' ') + ' Z';
  
      return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg"
                style="display: block; margin: 0;">
                <path d="${pathData}" fill="none" stroke="#0ca2ed" stroke-width="2" />
              </svg>`;
    }
    return '';
  }
  
  getScaleFactor(operations: Operation[]): number {
    let maxArea = 0;
    for (const operation of operations) {
      for (const polygon of operation.polygons) {
        const area = polygon.area || 0; // Utiliza el área proporcionada en el atributo 'area' del polígono
        if (area > maxArea) {
          maxArea = area;
        }
      }
    }
    // Definir un tamaño máximo deseado para los SVG
    const maxSize = 120000; // Por ejemplo, 500 es un tamaño arbitrario para la máxima área posible
    
    // Calcular el factor de escala en función del área máxima y el tamaño máximo deseado
    return maxArea !== 0 ? maxSize / maxArea : 1;
  }

  getData(propId: number) {
    this.propertyService.getPropertyById(propId).subscribe(data => {
      this.property = data;
      this.devices = [];
      this.property.devices.forEach(dev => {
        this.devices.push(dev);
        this.isConected(dev.devicesId).subscribe(conected => {
          dev.conected = conected;
        });
      })
      console.log(this.devices);
    });

    this.propertyService.getOperationAndDevicesByPropertyId(propId).subscribe(data => {
      this.operations = data;
    })

    //   this.devices = [];
    //   this.operations.forEach(ope => {
    //     ope.devices.forEach(dev => {
    //       this.devices.push(dev);
    //       this.isConected(dev.devicesId).subscribe(conected => {
    //         dev.conected = conected;
    //       });
    //     })
    //   });
    // })
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

  getOperationNameByDevId(devId: number): string {
    if (!this.operations) {
      return ''; // O maneja el caso según tus necesidades
  }
  const operation = this.operations.find(ope =>
      ope.polygons.some(poly =>
          poly.devices && poly.devices.some(dev => dev.devicesId === devId)
      )
  );
  
    // Si se encuentra una operación asociada, devolver su nombre
    if (operation) {
      return operation.operationName;
    }
  
    // Si no se encuentra ninguna operación asociada, devolver el nombre de la propiedad
    return this.property.propNombre;
  }

  getDevicesNames(devices: Device[]): string {
    const deviceNames = devices.map(dev => dev.devicesNombre);
    return deviceNames.length > 0 ? deviceNames.join(', ') : 'Ninguno';
  }
}
