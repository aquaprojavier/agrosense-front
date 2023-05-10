import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

// import { DeviceService } from 'src/app/core/services/device.service';
import { PropertyService } from 'src/app/core/services/property.service';
import { DataService } from 'src/app/core/services/data.service';

import { ActivatedRoute, Params } from '@angular/router';
import { Device } from 'src/app/core/models/device.models';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditComponent implements OnInit {

  timeWithoutConexion: number = 4 * 60 * 60 * 1000;
  actualDate: Date = new Date();
  argentinaTimezoneOffset = -3; // GMT-3
  actualDateInArgentina: Date = new Date(this.actualDate.getTime() + this.argentinaTimezoneOffset * 60 * 60 * 1000);

  propId: number = 1;
  devices: Device[];

  constructor(
    // private deviceService: DeviceService,
    private dataService: DataService,
    private propertyService: PropertyService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['id'];
      this.getData(this.propId)
    },
      (error) => {
        console.log(error);
      }
    )
  }

  getData(id: number){
    this.propertyService.getDevicesByPropertyId(this.propId).subscribe(data =>{
      this.devices = data;
      this.devices.forEach(dev => {
        this.isConected(dev.devicesId).subscribe(conected => {
          dev.conected = conected;
        });
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
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
        console.log(error);
        return of(false);
      })
    );
  }

}