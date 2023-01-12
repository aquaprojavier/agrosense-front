import { Component, OnInit, ViewEncapsulation } from '@angular/core';
// import { DeviceService } from 'src/app/core/services/device.service';
import { PropertyService } from 'src/app/core/services/property.service';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from 'src/app/core/models/device.models';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditComponent implements OnInit {

  deviceId: number = 1;
  devices: Device[];

  constructor(
    // private deviceService: DeviceService,
    private propertyService: PropertyService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.deviceId = params['id'];
      this.getData(this.deviceId)
    },
      (error) => {
        console.log(error);
      }
    )
  }

  getData(id: number){
    this.propertyService.getDevicesByPropertyId(this.deviceId).subscribe(data =>{
      this.devices = data;
      console.log(this.devices);
    })
  }

}
