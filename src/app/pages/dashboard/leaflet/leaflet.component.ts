import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { control, geoJSON, Icon, LatLng, Map, marker, tileLayer, layerGroup } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { CargarService } from 'src/app/core/services/cargar.service'
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Data } from 'src/app/core/models/data.models';
import { Operation } from 'src/app/core/models/operation.models';
import { Property } from 'src/app/core/models/property.models';
import { Device } from 'src/app/core/models/device.models';

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
  property: Property;
  operations: Operation[];
  devices: Device[] = [];
  propId: any;
  myMap = null;
  ur: number;
  wc: number;
  lastData: Data[] = [];
  sanitizedUrl: SafeResourceUrl | null = null;
  
  gaugeIcon = new Icon({
    iconUrl: 'assets/images/water-meter.png', // Ruta local de tu imagen de 32x32 píxeles
    iconSize: [32, 32],        // Tamaño del icono [ancho, alto]
    iconAnchor: [16, 32],      // Punto del icono que se alinea con la ubicación del marcador
    popupAnchor: [0, -16]      // Punto donde se abrirá el popup en relación con el icono
});



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
        this.showMap(this.property, this.operations)
      })
    });
  };

  showMap(property, operations) {
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove();
    }

    this.myMap = new Map('map').setView([0, 0], 14);
    const arcgisTileLayer = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    // Crear una capa de grupo para los polígonos
    const polygonLayer = layerGroup();
    // Agregar la capa de polígonos al mapa
    polygonLayer.addTo(this.myMap);

    // URL de los tiles recibida de la API (con placeholders)
    let tileURL = 'http://api.agromonitoring.com/tile/1.0/{z}/{x}/{y}/0205e8d1400/6509191675325506540ba823?appid=8dbe5b04b083a07e2c25cd0193c562fc';

    // Agregar capa de tiles con tu polígono
    let ndviTileLayer = tileLayer(tileURL, {
      // Opciones adicionales de la capa de tiles
    });
    // Agregar control de capas
    const baseLayers = {
      'ArcGIS': arcgisTileLayer
    };

    const overlayLayers = {
      'NDVI': ndviTileLayer, // Capa de mosaicos NDVI
      'Polygons': polygonLayer // Capa de grupo de polígonos
    };
    // Agregar control de capas
    const layerControl = control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(this.myMap);

    // Agregar el control de capas al mapa
    layerControl.addTo(this.myMap);

    let poligonToGjson;
    let poligonoStyle = { color: "#e8e81c", weight: 2.5, opacity: 1, fillOpacity: 0.0 };
    let bounds;

    // Poligono de la Propiedad
    let poligonObj = JSON.parse(property.geojson);
    poligonToGjson = geoJSON(poligonObj, { style: poligonoStyle }).addTo(this.myMap);
    bounds = poligonToGjson.getBounds();
    this.myMap.fitBounds(bounds);

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    // Function to add markers
    const addMarker = (dev, data, icon) => {
       // Determine the text color based on the value of data.volt
  const textColor = data.volt < 3.2 ? 'red' : 'black';
      marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
<div class="container text-center" style="width: 160px;line-height: 0.5;margin-left: 0px;margin-right: 0px;padding-right: 0px;padding-left: 0px;">   

<div class="row">
<div class="col-6">
  <div>
    <h5 style="color: black;margin-bottom: 0px;">Dispositivo:<br><b>${dev.devicesNombre}</b></h5>
  </div>
</div>
<div class="col-6">
  <div>
  <h5 style="color: black; margin-bottom: 0px;">Bateria:<br><b style="color: ${textColor};">${data.volt} V.</b></h5>  </div>
</div>
</div>
<div class="row">
  <div class="col-12">
      <img src="assets/images/sensor.png" alt="">
      </div>
      </div>    
      <div class="row">
      <div class="col-12">
      <h2 style="margin-bottom: 0px;color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
        ${icon === this.redIcon ? 'PELIGRO' : icon === this.blueIcon ? 'SATURADO' : 'OPTIMO'}
      </h2>
      </div>
      </div>
<div class="row">
  <div class="col-4">
    <img src="assets/images/root50x50.png" alt=""> 
  </div>
  <div class="col-8">
    <div class="row">
      <div class="col-12">
        <h5 style="margin-bottom: 0px;margin-top: 5px;color: black; text-align: left;">30 cm: <b style="color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
          ${data.dataHum1}%
        </b></h5>
      </div>
      <div class="col-12">
      <h5 style="color: black; text-align: left;">60 cm: <b style="color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
          ${data.dataHum2}%
        </b></h5>
      </div>
    </div>
  </div>
</div>

  <div class="row">
  <div class="col-6">
    <h5 style="color: black;margin-bottom: 0px;">HR:<br><img src="assets/images/water.png" alt=""> <b>${data.dataHr} %</b></h5>
  </div>
  <div class="col-6">
    <h5 style="color: black;margin-bottom: 0px;">Temp:<br><img src="assets/images/termometro.png" alt=""> <b>${data.dataTemp} °C</b></h5>
  </div>
</div>

</div>

      `, { closeButton: false });

      loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, data.cc, data.pmp);
      this.lastData.push(data);
    };

    // Function to add polygons
    const addPolygons = (ope, color, icon = null, dev = null) => {
      ope.polygons.forEach(poli => {
        let poligonDevice = JSON.parse(poli.geojson);
        let poligon = geoJSON(poligonDevice, { style: { color } }).addTo(this.myMap);

        // Formatear ope.operationArea con 2 decimales
      const formattedOperationArea = ope.operationArea.toFixed(2);

        poligon.bindPopup(`
        <div class="container text-center" style="width: 160px;line-height: 0.5;margin-left: 0px;margin-right: 0px;padding-right: 0px;padding-left: 0px;">
          <div class="row">
            <div class="col-12" style="line-height: 0.5;">
             <div class="text-center">
                <img src="assets/images/location.png" alt=""><br><br>
                Operacion: <b>${ope.operationName}</b><br><br>
              </div>
              <div class="text-center">
                <img src="assets/images/selection.png" alt=""> Superficie: <b>${formattedOperationArea} ha.</b><br>
              </div>
              <div class="text-center">
                <img src="assets/images/grapes.png" alt=""> Cultivo: <b>${ope.crop.cropName}</b><br>
              </div>
              ${dev ? `<div class="text-center">
                          <img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br>
              </div>` : ''}
            </div>
          </div>
        </div>
        `, { closeButton: false });
        // Agregar el polígono a la capa de grupo
        polygonLayer.addLayer(poligon);
      });
    };

    this.devices = [];

    operations.forEach(ope => {
      if (ope.devices.length === 0) {
        addPolygons(ope, "#302e2e");
      } else {
        ope.devices.forEach(dev => {
          this.devices.push(dev);
          this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(
            data => {
              if (data.dataHum <= data.pmp) {
                addMarker(dev, data, this.gaugeIcon);
                addPolygons(ope, "#CB2B3E", this.redIcon, dev);
              } else if (data.dataHum >= data.cc) {
                addMarker(dev, data, this.blueIcon);
                addPolygons(ope, "#0481bf", this.blueIcon, dev);
              } else if (data.dataHum > data.pmp && data.dataHum < data.cc) {
                addMarker(dev, data, this.greenIcon);
                addPolygons(ope, "#2AAD27", this.greenIcon, dev);
              }
            },
            error => {
              console.log(error);
            }
          );
        });
      }
    });

  };


}
