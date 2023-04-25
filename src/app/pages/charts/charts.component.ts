import { Component, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { ActivatedRoute, Params } from '@angular/router';
import { DataService } from 'src/app/core/services/data.service';
import { Data } from 'src/app/core/models/data.models';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})
export class ChartsComponent {

  datos: Data[] = [];
  deviceId: number = 1;

  constructor(@Inject(PLATFORM_ID) 
    private platformId: Object, 
    private zone: NgZone,
    private activatedRoute: ActivatedRoute,
    private dataService: DataService) {}

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
    this.deviceId = params['id'];
      //request data from service
      this.getData(this.deviceId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getData(id: number) {
    this.dataService.fullDataByDeviceId(id).subscribe(datos => {
      this.datos = datos
    });
  }
}
