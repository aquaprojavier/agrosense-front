import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { geoJSON, Icon, LatLng, LatLngExpression, map, Map, marker, tileLayer } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { DataService } from 'src/app/core/services/data.service';
import { CargarService } from 'src/app/core/services/cargar.service'
import { User } from '../../../core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
declare function loadLiquidFillGauge(elementId: string, value: number, limit: number, config?: any): void;
import { from } from 'rxjs';

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
  limit: number = 23;
  lastData: number[] = [];
  
  redIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  greenIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  greyIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private dataService: DataService,
    private cargaScript: CargarService) { 
      this.cargaScript.carga(["loadFillGauge"]);
      // console.log(loadLiquidFillGauge);
     }

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

  createMap(property, devices) {

    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }
    this.myMap = new Map('map').setView(property.coordenadas as [number, number], 14);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    let poli = JSON.parse(this.property.geojson);
    let poligonoStyle = { color: "#e8e81c", weight: 2.5, opacity: 1, fillOpacity: 0.0 };

    geoJSON(poli, { style: poligonoStyle }).addTo(this.myMap);

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });
    console.log(devices);
    devices.forEach(element => {
      
      this.dataService.lastDataByDeviceId(element.devicesId).subscribe(data => {
        
        if (data === 0.0 || null) {
          marker(element.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<b>${element.devicesNombre}</b><br>${element.devicesCultivo}<br>SIN DATOS<br>`);
          console.log(element.devicesId);
          let operacionStyle = { color: "#7B7B7B" };
          let poligonDevice = JSON.parse(element.geojson);
          geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        } else if (data < this.limit) {
          marker(element.coordenadas, { icon: this.redIcon }).addTo(this.myMap).bindPopup(`<b>${element.devicesNombre}</b><br>${element.devicesCultivo}<br>Humedad: ${data}%<br>`);
          console.log(element.devicesId);
          loadLiquidFillGauge(`fillgauge${element.devicesId}`, data, this.limit);
          this.lastData.push(data);
          let operacionStyle = { color: "#CB2B3E" };
          let poligonDevice = JSON.parse(element.geojson);
          geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        } else {
          marker(element.coordenadas, { icon: this.greenIcon }).addTo(this.myMap).bindPopup(`<b>${element.devicesNombre}</b><br>${element.devicesCultivo}<br>Humedad: ${data}%<br>`);
          console.log(element.devicesId);
          loadLiquidFillGauge(`fillgauge${element.devicesId}`, data, this.limit);
          this.lastData.push(data);
          let operacionStyle = { color: "#2AAD27" };
          let poligonDevice = JSON.parse(element.geojson);
          geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        }
      })
    });
    
  };

}
