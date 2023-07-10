import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { geoJSON, Icon, LatLng, Map, marker, tileLayer } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { CargarService } from 'src/app/core/services/cargar.service'
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Data } from 'src/app/core/models/data.models';

declare function loadLiquidFillGauge(elementId: string, value: number, wc: number, ur: number, config?: any): void;
// import { from } from 'rxjs';

@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss']
})
export class LeafletComponent implements OnInit {
  // bread crumb items
  fechaActual: string;
  fechaAyer: string;
  fechaAntier: string;
  fechaAntiantier: string;
  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: any;
  devices: any[] = [];
  propId: any;
  myMap = null;
  ur: number;
  wc: number;
  lastData: Data[] = [];
  sanitizedUrl: SafeResourceUrl | null = null;

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
    private cargaScript: CargarService,
    private sanitizer: DomSanitizer) {

    this.cargaScript.carga(["loadFillGauge"]);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const antier = new Date(hoy);
    antier.setDate(hoy.getDate() - 2);
    const antiantier = new Date(hoy);
    antiantier.setDate(hoy.getDate() - 3);

    this.fechaActual = formatDate(hoy, 'dd \'de\' MMMM', 'es');
    this.fechaAyer = formatDate(ayer, 'dd \'de\' MMMM', 'es');
    this.fechaAntier = formatDate(antier, 'dd \'de\' MMMM', 'es');
    this.fechaAntiantier = formatDate(antiantier, 'dd \'de\' MMMM', 'es');

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
      this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.meteoblue.com/en/weather/widget/daily/${this.property?.propUbic}?geoloc=fixed&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=0&pictoicon=1&maxtemperature=0&maxtemperature=1&mintemperature=0&mintemperature=1&windspeed=0&windspeed=1&windgust=0&winddirection=0&winddirection=1&uv=0&humidity=0&precipitation=0&precipitation=1&precipitationprobability=0&precipitationprobability=1&spot=0&spot=1&pressure=0&layout=dark`);
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

    let poligonObj = JSON.parse(property.geojson);
    let poligonoStyle = { color: "#e8e81c", weight: 2.5, opacity: 1, fillOpacity: 0.0 };
    let poligonToGjson = geoJSON(poligonObj, { style: poligonoStyle }).addTo(this.myMap);
    this.myMap.fitBounds(poligonToGjson.getBounds());

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    this.devices = [];

    operations.forEach(ope => {

      if (ope.devices && ope.devices.length === 0) {

        let operacionStyle = { color: "#7B7B7B" };
        let poligonDevice = JSON.parse(ope.operationGeojson);
        let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })

      } else if (ope.devices && ope.devices.length >= 2) {
        let average: number = 0;
        let counter: number = 0;

        ope.devices.forEach(dev => {
          counter += 1;
          console.log(counter);
          this.devices.push(dev);

          this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
            console.log("------------------------lastDataByDeviceId----------------------")
            console.log(data);
            average += data.dataHum
            console.log(average);

            if (data.dataHum <= data.pmp) {

              marker(dev.coordenadas, { icon: this.redIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: red;">PELIGRO</h2></div>
              <div style="display: flex; align-items: center;">
                <img src="assets/images/root32px.png" alt=""> 
              <div>
                Humedad a 30cm: <b style="color: red;">${data.dataHum1}%</b><br><br><br>
                Humedad a 60cm: <b style="color: red;">${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, data.cc, data.pmp);
              this.lastData.push(data);
             
            } else if (data.dataHum >= data.cc) {

              marker(dev.coordenadas, { icon: this.blueIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: blue;">SATURADO</h2></div>
  
              <div style="display: flex; align-items: center;">
              <img src="assets/images/root32px.png" alt="">
              <div>
               Humedad a 30cm: <b>${data.dataHum1}%</b><br><br><br>
               Humedad a 60cm: <b>${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, data.cc, data.pmp);
              this.lastData.push(data);
              
            } else if (data.dataHum > data.pmp && data.dataHum < data.cc) {

              marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: green;">OPTIMO</h2></div>
  
              <div style="display: flex; align-items: center;">
              <img src="assets/images/root32px.png" alt="">
              <div>
               Humedad a 30cm: <b>${data.dataHum1}%</b><br><br><br>
               Humedad a 60cm: <b>${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, data.cc, data.pmp);
              this.lastData.push(data);
             
            }
            // else if (data.dataHum == 0.0) {

            //   marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: grey;">SIN DATOS</h2></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br></Div>`,{ closeButton: false });
            //   let idnull = dev.devicesId;
            //   let operacionStyle = { color: "#7B7B7B" };
            //   let poligonDevice = JSON.parse(ope.operationGeojson);
            //   if (ope.devices.lenght > 1) {
            //     geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            //   }
            //   for (let i = 0; i < this.devices.length; i++) {
            //     if (this.devices[i].devicesId === idnull) {
            //       this.devices.splice(i, 1);
            //     }
            //   }
            // }
    
            console.log('promedio: ' + average/counter);
            const promedio = average/counter;
            if (promedio <= data.pmp) {
              let operacionStyle = { color: "#CB2B3E" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(
                `<div style="line-height: 0.5;">
                  <div style="text-align: center;">
                    <img src="assets/images/location.png" alt=""><br><br>
                    Operacion: <b>${ope.operationName}</b><br><br>
                  </div>
                  <img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br>
                  <img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br>
                </div>`,
                { closeButton: false }
              );
            } else if (promedio >= data.cc) {
              let operacionStyle = { color: "#0481bf" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false });
            } else {
              let operacionStyle = { color: "#2AAD27" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false });
            }

          },
            (error) => {
              console.log(error);
              marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: grey;">SIN DATOS</h2></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br></Div>`, { closeButton: false });
              let idnull = dev.devicesId;
              let operacionStyle = { color: "#7B7B7B" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              if (ope.devices.length >= 1) {
                let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
                poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })

              }
              for (let i = 0; i < this.devices.length; i++) {
                if (this.devices[i].devicesId === idnull) {
                  this.devices.splice(i, 1);
                }
              }
            });
        
        });

      } else {

        ope.devices.forEach(dev => {
          // console.log(dev)
          this.devices.push(dev);

          this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
            console.log("------------------------lastDataByDeviceId----------------------")
            console.log(data);

            if (data.dataHum <= data.pmp) {

              marker(dev.coordenadas, { icon: this.redIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: red;">PELIGRO</h2></div>
              <div style="display: flex; align-items: center;">
                <img src="assets/images/root32px.png" alt=""> 
              <div>
                Humedad a 30cm: <b style="color: red;">${data.dataHum1}%</b><br><br><br>
                Humedad a 60cm: <b style="color: red;">${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, data.cc, data.pmp);
              this.lastData.push(data);
              let operacionStyle = { color: "#CB2B3E" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(
                `<div style="line-height: 0.5;">
                  <div style="text-align: center;">
                    <img src="assets/images/location.png" alt=""><br><br>
                    Operacion: <b>${ope.operationName}</b><br><br>
                  </div>
                  <img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br>
                  <img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br>
                </div>`,
                { closeButton: false }
              );


            } else if (data.dataHum >= data.cc) {

              marker(dev.coordenadas, { icon: this.blueIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: blue;">SATURADO</h2></div>
  
              <div style="display: flex; align-items: center;">
              <img src="assets/images/root32px.png" alt="">
              <div>
               Humedad a 30cm: <b>${data.dataHum1}%</b><br><br><br>
               Humedad a 60cm: <b>${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum1, data.cc, data.pmp);
              this.lastData.push(data);
              let operacionStyle = { color: "#0481bf" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })

            } else if (data.dataHum > data.pmp && data.dataHum < data.cc) {

              marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;">
              <img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: green;">OPTIMO</h2></div>
  
              <div style="display: flex; align-items: center;">
              <img src="assets/images/root32px.png" alt="">
              <div>
               Humedad a 30cm: <b>${data.dataHum1}%</b><br><br><br>
               Humedad a 60cm: <b>${data.dataHum2}%</b><br>
              </div>            
              </div>
              <br>
              <img src="assets/images/water.png" alt=""> HR: <b>${data.dataHr}%</b><br><br>
              <img src="assets/images/termometro.png" alt=""> Temp: <b>${data.dataTemp}</b><br><br>
              </div>`, { closeButton: false });

              loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, data.cc, data.pmp);
              this.lastData.push(data);
              let operacionStyle = { color: "#2AAD27" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
              poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })

            }
            // else if (data.dataHum == 0.0) {

            //   marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: grey;">SIN DATOS</h2></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br></Div>`,{ closeButton: false });
            //   let idnull = dev.devicesId;
            //   let operacionStyle = { color: "#7B7B7B" };
            //   let poligonDevice = JSON.parse(ope.operationGeojson);
            //   if (ope.devices.lenght > 1) {
            //     geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            //   }
            //   for (let i = 0; i < this.devices.length; i++) {
            //     if (this.devices[i].devicesId === idnull) {
            //       this.devices.splice(i, 1);
            //     }
            //   }
            // }
          },
            (error) => {
              console.log(error);
              marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap).bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/sensor.png" alt=""><br><br>Dispositivo: <b>${dev.devicesNombre}</b><br><br><h2 style="color: grey;">SIN DATOS</h2></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br></Div>`, { closeButton: false });
              let idnull = dev.devicesId;
              let operacionStyle = { color: "#7B7B7B" };
              let poligonDevice = JSON.parse(ope.operationGeojson);
              if (ope.devices.length >= 1) {
                let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
                poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })

              }
              for (let i = 0; i < this.devices.length; i++) {
                if (this.devices[i].devicesId === idnull) {
                  this.devices.splice(i, 1);
                }
              }
            });
        });
      }

    });
  };

}
