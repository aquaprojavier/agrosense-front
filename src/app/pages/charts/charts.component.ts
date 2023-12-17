import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Data } from 'src/app/core/models/data.models';
import { Soil } from 'src/app/core/models/soil.model';
import { DataService } from 'src/app/core/services/data.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { Device } from 'src/app/core/models/device.models';


@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit {
  
  datos: Data[] = [];
  deviceId: number = 1;
  soil: Soil;
  selectedDays: number = 30; // Valor predeterminado, puedes ajustarlo según tu lógica
  device: Device

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataService: DataService,
    private deviceService: DeviceService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.deviceId = params['id'];
      this.getData(this.deviceId, 30);
      this.getDevice(this.deviceId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getDevice(id: number) {
    this.deviceService.getDeviceById(id).subscribe(dev => {
      this.device = dev;
      console.log(dev)
    })
  }

  getData(id: number, days: number) {
    this.dataService.showDataByIdAndLastDays(id, days).subscribe(data => {
      this.datos = data //esto se envia a los charts hijos
    });
  }

  onButtonClick(days: number) {
    this.selectedDays = days; // Actualizar el valor de días seleccionado
    this.getData(this.deviceId, days); // Llamar a la función getData con el nuevo número de días
  }

}
