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
import { AgromonitoringService } from 'src/app/core/services/agromonitoring.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  // ndviTileLayer: any;
  ndviLayerGroup: any; // Crear un layerGroup para las capas NDVI

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
    private sanitizer: DomSanitizer,
    private agromonitoringService: AgromonitoringService) {

    this.ndviLayerGroup = layerGroup();
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

  getImagesApi(polygonId: string): Observable<string | undefined> {
    return this.agromonitoringService.searchImages(1586131200, 1586553600, polygonId).pipe(
      switchMap(data => {
        const ndviLink = this.agromonitoringService.getSentinel2NDVILink(data);
        if (ndviLink) {
          // console.log('Enlace NDVI de Sentinel-2:', ndviLink);
          return of(ndviLink); // Devuelve el enlace NDVI si se encuentra
        } else {
          // console.log('No se encontró el enlace NDVI para Sentinel-2.');
          return of(undefined); // Devuelve undefined si no se encuentra
        }
      })
    );
  }


  showMap(property, operations) {
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove();
    }

    this.myMap = new Map('map').setView([0, 0], 14);
    const arcgisTileLayer = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    // Crear una capa de grupo para los polígonos
    let polygonLayer = layerGroup();
    // Agregar la capa de polígonos al mapa
    polygonLayer.addTo(this.myMap);

    // Agregar control de capas
    const baseLayers = {
      'ArcGIS': arcgisTileLayer
    };

    // Variables para las capas
    let layerControl;
    let ndviTileLayer;

    // Función para actualizar el layerControl
    const updateLayerControl = (baseLayers, overlayLayers) => {
      // Si el layerControl ya está inicializado, eliminarlo del mapa
      if (layerControl) {
        layerControl.remove();
      }
      // Crear un nuevo layerControl y agregarlo al mapa
      layerControl = control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(this.myMap);
    };

    // const overlayLayers = {
    //   'NDVI': this.ndviTileLayer, // Capa de mosaicos NDVI
    //   'Polygons': polygonLayer // Capa de grupo de polígonos
    // };

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
    const ndviTileLayers = {};
    // Function to add polygons
    const addPolygons = (ope, color, icon = null, dev = null) => {
      ope.polygons.forEach(poli => {
        let poligonDevice = JSON.parse(poli.geojson);
        let poligon = geoJSON(poligonDevice, { style: { color } }).addTo(this.myMap);

        
        // Obtener el ID del polígono (cambiar esto por la forma en que identificas cada polígono)
        const poliId = `poli_${poli.polygonId}`;
        // Obtener el enlace NDVI para el polígono actual
        this.getImagesApi(poli.agromonitoringId).subscribe(ndviLink => {
          // Aquí puedes manejar el enlace NDVI o undefined
          if (ndviLink) {
            console.log(`Enlace NDVI para el polígono ${poliId}:`, ndviLink);
            const tileURL2 = ndviLink;

            // Actualizar o crear la capa NDVI correspondiente a este polígono
            let ndviTileLayer = ndviTileLayers[poliId];
            if (ndviTileLayer) {
              ndviTileLayer.setUrl(tileURL2);
            } else {
              ndviTileLayer = tileLayer(tileURL2, {
                // Opciones adicionales de la capa de tiles
              }).addTo(this.myMap);
              // Almacenar la capa en el objeto ndviTileLayers
              ndviTileLayers[poliId] = ndviTileLayer;
            }
            // Agregar la capa de mosaicos NDVI al control de capas después de obtenerla
            const overlayLayers = {
              'NDVI': ndviTileLayer,
              'Polygons': polygonLayer
            };
            updateLayerControl(baseLayers, overlayLayers);
          } else {
            console.log(`No se encontró el enlace NDVI para el polígono ${poliId}.`);
          }
        });


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
