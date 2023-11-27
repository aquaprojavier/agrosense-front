import { Component, Inject, OnInit, NgZone, PLATFORM_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { control, geoJSON, Icon, LatLng, Map, marker, tileLayer, layerGroup, ExtraMarkers, LayerGroup } from 'leaflet';
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
import 'leaflet-extra-markers';

import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";

import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Micro from "@amcharts/amcharts5/themes/Micro";

declare function loadLiquidFillGauge(elementId: string, value: number, wc: number, ur: number, config?: any): void;

type AllowedMarkerColor = "orange" | "red" | "orange-dark" | "yellow" | "blue" | "blue-dark" | "cyan" | "purple" | "violet" | "pink" | "green-dark" | "green" | "green-light" | "black" | "white" | `#${string}`;

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
  polygonLayer: LayerGroup;
  lastDatas: Data[];

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
    @Inject(PLATFORM_ID)
    private platformId: Object,
    private zone: NgZone,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private dataService: DataService,
    private cargaScript: CargarService,
    private sanitizer: DomSanitizer,
    private agromonitoringService: AgromonitoringService) {


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

  // Run the function only in the browser
  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  createValueChart(div, datos, color) {
    this.browserOnly(() => {
      // Dispose previously created Root element
      this.maybeDisposeRoot(div);

      let root = am5.Root.new(div);

      root.setThemes([
        am5themes_Micro.new(root),
        am5themes_Dark.new(root)//modo dark
      ]);

      let chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none"
      }));

      chart.plotContainer.set("wheelable", false);
      chart.zoomOutButton.set("forceHidden", true);

      let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        strictMinMax: true,
        extraMax: 0.02,
        extraMin: 0.02,
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      let xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          maxDeviation: 0,
          baseInterval: {
            timeUnit: "minute",
            count: 10
          },
          renderer: am5xy.AxisRendererX.new(root, {})
        })
      );

      let series = chart.series.push(am5xy.SmoothedXLineSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "dataTemp",
        valueXField: "dataFecha",
        stroke: color,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY} C",
          keepTargetHover: true
        })
      }));

      series.data.processor = am5.DataProcessor.new(root, {
        numericFields: ["dataTemp"],
        dateFields: ["dataFecha"],
        dateFormat: "yyyy-MM-dd HH:mm:ss"
      });
      // Add cursor
      // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
      let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        // yAxis: valueAxis,
        // xAxis: dateAxis,
        // behavior: "zoomX"
      }));


      series.strokes.template.setAll({
        strokeWidth: 2
      });
      console.log(datos);
      series.data.setAll(datos);
    });
  }

  getImagesApi(polygonId: string): Observable<string | undefined> {
    return this.agromonitoringService.searchImages(1586131200, 1586553600, polygonId).pipe(
      switchMap(data => {
        const ndviLink = this.agromonitoringService.getSentinel2NDVILink(data);
        if (ndviLink) {
          return of(ndviLink); // Devuelve el enlace NDVI si se encuentra
        } else {
          // console.log('No se encontró el enlace NDVI para Sentinel-2.');
          return of(undefined); // Devuelve undefined si no se encuentra
        }
      })
    );
  }

  getAllImages(layerControl) {
    // this.polygonLayer = layerGroup();
    const ndviLayerGroup = layerGroup();
    this.operations.forEach(ope => {
      ope.polygons.forEach(poli => {

        this.getImagesApi(poli.agromonitoringId).subscribe((ndviLink: string | null) => {
          if (ndviLink) {
            const tileURL = ndviLink;
            const newNDVILayer = tileLayer(tileURL, {
              // Opciones adicionales de la capa de tiles
            });
            // Agregar la capa NDVI al LayerGroup
            ndviLayerGroup.addLayer(newNDVILayer);
            // Actualizar el control de capas solo cuando se añada la primera capa NDVI
            if (ndviLayerGroup.getLayers().length === 1) {
              if (layerControl) {
                layerControl.addOverlay(ndviLayerGroup, 'NDVI'); // Añadir el LayerGroup al control de capas con un nombre específico
              }
            }
          } else {
            console.log(`No se encontró el enlace NDVI para el polígono poli_${poli.name}.`);
          }
        });
      })
    });

  };
  // Función para crear el ícono de temperatura con color dinámico según la temperatura
  createTempIcon(temperature: number): Icon {
    let markerColor: AllowedMarkerColor = 'blue';

    if (temperature < 5) {
      markerColor = '#088DFC';
    } else if (temperature >= 5 && temperature < 25) {
      markerColor = '#A8FAAA';
    } else if (temperature >= 25 && temperature < 35) {
      markerColor = '#FFAC33';
    } else if (temperature >= 35) {
      markerColor = '#FC3C08';
    }
    // const tempString = temperature.toString() + '\u2103';
    const tempString = temperature.toString();
    return ExtraMarkers.icon({
      shape: 'square',
      markerColor: markerColor,
      prefix: '',
      icon: 'fa-number',
      iconColor: '#2e222c',
      iconRotate: 0,
      extraClasses: '',
      number: tempString,
      svg: true
    });
  }

  showMap(property, operations) {
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove();
    }

    this.myMap = new Map('map').setView([0, 0], 14);
    const arcgisTileLayer = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    // Crear una capa de grupo para los polígonos y agregarla al mapa
    this.polygonLayer = layerGroup().addTo(this.myMap);
    let soilLayer = layerGroup().addTo(this.myMap);
    let tempLayer = layerGroup().addTo(this.myMap);
    let otherLayer = layerGroup().addTo(this.myMap);

    // Agregar control de capas
    const baseLayers = {
      'ArcGIS': arcgisTileLayer,
    };

    // Capas vacías inicialmente
    const overlayLayers = {
      'Operaciones riego': this.polygonLayer,
      'Sensores suelo': soilLayer,
      'Sensores ambiente': tempLayer,
      'Otros sensores': otherLayer
    };

    //crea un control de capas 
    let layerControl = control.layers(baseLayers, overlayLayers).addTo(this.myMap);


    this.getAllImages(layerControl);

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
              ${dev ? `<div class="text-center">Variedad: <b>${dev.devicesCultivo}</b><br>
              </div>` : ''}
            </div>
          </div>
        </div>
        `, { closeButton: false });
        // Agregar el polígono a la capa de grupo
        this.polygonLayer.addLayer(poligon);
      });
    };

    this.devices = [];

    // Function to add markers
    const addMarker = (dev, data, icon) => {
      // Determine the text color based on the value of data.volt
      const textColor = data.volt < 3.2 ? 'red' : 'black';
      let iconSoil = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
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

      soilLayer.addLayer(iconSoil);
      loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, data.cc, data.pmp);
      this.lastData.push(data);
    };

    // Function to add markers
    const addTempMarker = (dev, data, icon) => {
      // Determine the text color based on the value of data.volt
      const textColor = data.volt <= 3.2 ? 'red' : 'black';
      let iconTemp = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
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
          <div id="chartdiv" style="height: 25px; width: 90%">
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
  
        `, { closeButton: false }).on('click', (e) => {
        console.log('Hiciste clic en el marcador', e.latlng);
        this.dataService.lastDatasByDeviceId(dev.devicesId, 5).subscribe(lastdata => {
          this.createValueChart("chartdiv", lastdata, "#3eedd3")
        });
      });
      tempLayer.addLayer(iconTemp);

    };

    // Function to add markers
    const addGaugeMarker = (dev, icon) => {
      // Determine the text color based on the value of data.volt
      let gaugeIcon = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
  <div class="container text-center" style="width: 160px;line-height: 0.5;margin-left: 0px;margin-right: 0px;padding-right: 0px;padding-left: 0px;">   
  <div class="row">
  <div class="col-6">
    <div>
      <h5 style="color: black;margin-bottom: 0px;">Dispositivo:<br><b>${dev.devicesNombre}</b></h5>
    </div>
  </div>
  <div class="col-6">
    <div>
    <h5 style="color: black; margin-bottom: 0px;">Bateria:<br><b style="color: 4 V.</b></h5>  </div>
  </div>
  </div>
  <div class="row">
    <div class="col-12">
        <img src="assets/images/sensor.png" alt="">
        </div>
        </div>    
        <div class="row">
        <div class="col-12">
        <h2 style="margin-bottom: 0px;>
          CAUDALIMETRO
        </h2>
        </div>
        </div>
   </div>
        `, { closeButton: false });
      otherLayer.addLayer(gaugeIcon);
    };

    operations.forEach(ope => {
      if (ope.devices.length === 0) {
        addPolygons(ope, "#302e2e");
      } else {
        ope.devices.forEach(dev => {
          this.devices.push(dev);
          this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(
            data => {
              if (data.dataHum <= data.pmp) {
                addMarker(dev, data, this.redIcon);
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

    property.devices.forEach(dev => {

      if (dev.devicesType === "Caudalimetro") {
        this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
          addGaugeMarker(dev, this.gaugeIcon);
        })

      };
      if (dev.devicesType === "Temp. / HR") {
        this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
          this.dataService.lastDatasByDeviceId(dev.devicesId, 5).subscribe(lastdata => {
            const tempIcon = this.createTempIcon(data.dataTemp)
            addTempMarker(dev, data, tempIcon);
            this.createValueChart("chartdiv", lastdata, "#3eedd3")
          })
        });
      }
    })
  };

  maybeDisposeRoot(divId) {
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root && root.dom.id == divId) {
        root.dispose();
      }
    });
  }

}
