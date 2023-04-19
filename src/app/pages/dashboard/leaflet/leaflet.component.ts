import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { geoJSON, Icon, LatLng, Map, marker, tileLayer } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { CargarService } from 'src/app/core/services/cargar.service'
import { User } from '../../../core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
declare function loadLiquidFillGauge(elementId: string, value: number, wc: number, ur: number, config?: any): void;
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
  operations: any;
  devices: any[] = [];
  propId: any;
  myMap = null;
  ur: number = 17;
  wc: number = 27
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
  blueIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
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
    private operationService: OperationService,
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
      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        this.createMap(this.property, this.operations)
      })
    });
  };

  createMap(property, operations) {

    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }
    // this.myMap = new Map('map').setView(property.coordenadas as [number, number], 15);
    this.myMap = new Map('map').setView([0, 0], 15);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    let poli = JSON.parse(property.geojson);
    let poligonoStyle = { color: "#e8e81c", weight: 2.5, opacity: 1, fillOpacity: 0.0 };

    let poligon = geoJSON(poli, { style: poligonoStyle }).addTo(this.myMap);
    this.myMap.fitBounds(poligon.getBounds());

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    this.devices = [];
    operations.forEach(ope => {

      ope.devices.forEach(dev => {

        this.devices.push(dev);
        
        this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {

          if (data.dataHum1 <= this.ur) {
            marker(dev.coordenadas, { icon: this.redIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: red;">PELIGRO</h2></div><img src="../../../../assets/images/water.png" alt=""> Humedad relativa: <b>${data.dataHr}%</b><br><br><img src="../../../../assets/images/termometro.png" alt=""> Temperatura: <b>${data.dataTemp}</b><br><br><img src="../../../../assets/images/root.png" alt=""> Humedad de suelo: <b style="color: red;">${data.dataHum1}%</b><br></div>`);
            loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, this.wc, this.ur);
            this.lastData.push(data);
            let operacionStyle = { color: "#CB2B3E" };
            let poligonDevice = JSON.parse(ope.operationGeojson);
            let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="../../../../assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="../../../../assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

          } else if (data.dataHum1 >= this.wc) {
            marker(dev.coordenadas, { icon: this.blueIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: blue;">SATURADO</h2></div><img src="../../../../assets/images/water.png" alt=""> Humedad relativa: <b>${data.dataHr}%</b><br><br><img src="../../../../assets/images/termometro.png" alt=""> Temperatura: <b>${data.dataTemp}</b><br><br><img src="../../../../assets/images/root.png" alt=""> Humedad de suelo: <b>${data.dataHum1}%</b><br></div>`);
            loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, this.wc, this.ur);
            this.lastData.push(data);
            let operacionStyle = { color: "#0481bf" };
            let poligonDevice = JSON.parse(ope.operationGeojson);
            let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="../../../../assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="../../../../assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

          } else {
            marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: green;">OPTIMO</h2></div><img src="../../../../assets/images/water.png" alt=""> Humedad relativa: <b>${data.dataHr}%</b><br><br><img src="../../../../assets/images/termometro.png" alt=""> Temperatura: <b>${data.dataTemp}</b><br><br><img src="../../../../assets/images/root.png" alt=""> Humedad de suelo: <b>${data.dataHum1}%</b><br></div>`);
            loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, this.wc, this.ur);
            this.lastData.push(data);
            let operacionStyle = { color: "#2AAD27" };
            let poligonDevice = JSON.parse(ope.operationGeojson);
            let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="../../../../assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="../../../../assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

          }
        },
        (error) => {
          console.log(error);
          marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="../../../../assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: grey;">SIN DATOS</h2></div><img src="../../../../assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br></Div>`);
            let idnull = dev.devicesId;
            let operacionStyle = { color: "#7B7B7B" };
            let poligonDevice = JSON.parse(ope.operationGeojson);
            if (ope.devices.lenght > 1) {
              geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            }
            for (let i = 0; i < this.devices.length; i++) {
              if (this.devices[i].devicesId === idnull) {
                this.devices.splice(i, 1);
              }
            }
        });
      });
    });
  };

}
