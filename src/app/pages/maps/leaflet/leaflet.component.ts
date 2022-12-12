import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { geoJSON, LatLng, LatLngExpression, map, Map, marker, tileLayer } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { User } from '../../../core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss']
})
export class LeafletComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>;

  user: User;
  property: any;
  devices: any;
  propId: any;
  myMap = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Maps' }, { label: 'Leaflet Maps', active: true }];

    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['id'];
      this.getData(this.propId);
    },
      (error) => {
        console.log(error);
      }
    );
  };

  getData(id: number) {
    this.propertyService.getPropertyById(id).subscribe(data => {
      this.property = data;
     
      this.propertyService.getDevicesByPropertyId(this.propId).subscribe(data => {
        this.devices = Object.values(data);
        this.createMap(this.property, this.devices)
      });
    });
  };
 

  createMap(property, devices){

    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }
    this.myMap = new Map('map').setView(property.coordenadas as [number, number], 15);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    let poli = JSON.parse(this.property.geojson);
    let poligonoStyle = { color: "#e8e81c", weight: 2.5, opacity: 1, fillOpacity: 0.0 };

    geoJSON(poli, { style: poligonoStyle }).addTo(this.myMap);

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    devices.forEach(element => {
      let operacionStyle = {color: "#2AAD27"};
      marker(element.coordenadas).addTo(this.myMap);
      let poligonDevice = JSON.parse(element.geojson);
      geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
    });
  }

}
