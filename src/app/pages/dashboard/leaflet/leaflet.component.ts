import { Component, Inject, OnInit, NgZone, PLATFORM_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { control, geoJSON, Icon, LatLng, Map, marker, tileLayer, layerGroup, ExtraMarkers, Marker, LayerGroup } from 'leaflet';
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
import { Observable, of, forkJoin, EMPTY } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import 'leaflet-extra-markers';
import 'heatmap.js';
import { HeatData } from 'src/app/core/models/heatData.models';
import { IconService } from 'src/app/core/services/icon.service';
import { RecomendationService } from 'src/app/core/services/recomendation.service';

declare const HeatmapOverlay: any;

import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
// import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { Recomendation } from 'src/app/core/models/recom.models';
// import am5themes_Micro from "@amcharts/amcharts5/themes/Micro";

declare function loadLiquidFillGauge(elementId: string, value: number, wc: number, ur: number, config?: any): void;

type AllowedMarkerColor = "orange" | "red" | "orange-dark" | "yellow" | "blue" | "blue-dark" | "cyan" | "purple" | "violet" | "pink" | "green-dark" | "green" | "green-light" | "black" | "white" | `#${string}`;

@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss']
})
export class LeafletComponent implements OnInit {
  // bread crumb items
  currentDate: Date = new Date();
  heatmapLayerGroup: LayerGroup;
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
  sanitizedUrlPronost: SafeResourceUrl | null = null;
  sanitizedUrlWind: SafeResourceUrl | null = null;
  polygonLayer: LayerGroup;
  lastDatas: Data[];
  lastDataTempArray: Data[] = [];
  heatDataArray: HeatData[] = [];
  gaugeIcon: Icon;
  redIcon: Icon;
  greenIcon: Icon;
  blueIcon: Icon;
  greyIcon: Icon;
  yellowIcon: Icon;
  todayRecom: Recomendation[];

  constructor(
    private iconService: IconService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private dataService: DataService,
    private cargaScript: CargarService,
    private sanitizer: DomSanitizer,
    private agromonitoringService: AgromonitoringService,
    private recomendationService: RecomendationService) {


    this.cargaScript.carga(["loadFillGauge"]);
    // const hoy = new Date();
    // const ayer = new Date(hoy);
    // ayer.setDate(hoy.getDate() - 1);
    // const antier = new Date(hoy);
    // antier.setDate(hoy.getDate() - 2);
    // const antiantier = new Date(hoy);
    // antiantier.setDate(hoy.getDate() - 3);

    // this.fechaActual = formatDate(hoy, 'dd \'de\' MMMM', 'es');
    // this.fechaAyer = formatDate(ayer, 'dd \'de\' MMMM', 'es');
    // this.fechaAntier = formatDate(antier, 'dd \'de\' MMMM', 'es');
    // this.fechaAntiantier = formatDate(antiantier, 'dd \'de\' MMMM', 'es');
  }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Maps' }, { label: 'Leaflet Maps', active: true }];
    this.getIcons();
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['id'];
      this.getData(this.propId);
      this.getRecomendation(this.propId);
    },
      (error) => {
        console.log(error);
      }
    );
  };

  formatDate(date: any): string {
    // Convertir la fecha al formato 'yyyy-MM-dd' utilizando el pipe 'date'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  getRecomendation(propId: number): void {
    this.recomendationService.getRecomendationByProp(propId).subscribe(data => {
      this.todayRecom = data;
    });
  }
  
  getIcons() {
    this.gaugeIcon = this.iconService.getGaugeIcon();
    this.redIcon = this.iconService.getRedIcon();
    this.greenIcon = this.iconService.getGreenIcon();
    this.blueIcon = this.iconService.getBlueIcon();
    this.yellowIcon = this.iconService.getYellowIcon();
  }

  getData(id: number) {
    this.propertyService.getPropertyById(id).subscribe(data => {
      this.property = data;
      console.log(this.property);
      this.sanitizedUrlPronost = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.meteoblue.com/en/weather/widget/daily/${this.property?.propUbic}?geoloc=fixed&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=0&pictoicon=1&maxtemperature=0&maxtemperature=1&mintemperature=0&mintemperature=1&windspeed=0&windspeed=1&windgust=0&winddirection=0&winddirection=1&uv=0&humidity=0&precipitation=0&precipitation=1&precipitationprobability=0&precipitationprobability=1&spot=0&spot=1&pressure=0&layout=dark`);
      
      this.sanitizedUrlWind = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.meteoblue.com/en/weather/maps/widget/${this.property?.propUbic}?windAnimation=0&windAnimation=1&gust=0&gust=1&satellite=0&satellite=1&cloudsAndPrecipitation=0&cloudsAndPrecipitation=1&temperature=0&temperature=1&sunshine=0&extremeForecastIndex=0&geoloc=fixed&tempunit=C&windunit=km%252Fh&lengthunit=metric&zoom=7&autowidth=auto`);

      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        this.crearHeatMap(this.property).subscribe(() => {
          this.showMap(this.property, this.operations)
        });
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
  };

  createMiniChart(div, datos, color, campo) {
    this.browserOnly(() => {
        // Dispose previously created Root element
        this.maybeDisposeRoot(div);

        let root = am5.Root.new(div);
        root.setThemes([
            am5themes_Animated.new(root),
        ]);

        let chart = root.container.children.push(am5xy.XYChart.new(root, {
            // panX: false,
            // panY: false,
            // wheelX: "none",
            // wheelY: "none",
        }));

        // Add cursor
        // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
        let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
            // xAxis: xAxis,
            // behavior: "zoomX"
        }));
        cursor.lineY.set("visible", false);

        // Create axes
        // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
        let xAxis = chart.xAxes.push(
            am5xy.DateAxis.new(root, {
                // groupData: true,
                baseInterval: { timeUnit: "minute", count: 30 },
                renderer: am5xy.AxisRendererX.new(root, {}),
                // tooltip: am5.Tooltip.new(root, {})
            })
        );

        let valueAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            strictMinMax: true,
            extraMax: 0.1,
            extraMin: 0.1,
            renderer: am5xy.AxisRendererY.new(root, {}),
            // tooltip: am5.Tooltip.new(root, {})
        }));

        let series = chart.series.push(am5xy.LineSeries.new(root, {
            xAxis: xAxis,
            yAxis: valueAxis,
            valueYField: campo, // Utilizamos el nuevo campo pasado como argumento
            valueXField: "dataFecha",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{valueY}"
            })
        }));

        series.fills.template.setAll({
            fillOpacity: 0.2,
            visible: true
        });

        series.bullets.push(function (root) {
            return am5.Bullet.new(root, {
                sprite: am5.Circle.new(root, {
                    radius: 4,
                    fill: series.get("fill")
                })
            });
        });

        series.data.processor = am5.DataProcessor.new(root, {
            dateFields: ["dataFecha"],
            dateFormat: "yyyy-MM-dd HH:mm:ss"
        });

        // console.log(datos);
        series.appear(1000);
        chart.appear(1000, 100);
        series.data.setAll(datos);
    });
};

  getImagesApi(polygonId: string): Observable<string | undefined> {
    return this.agromonitoringService.searchImages(1586131200, 1586553600, polygonId).pipe(
      switchMap(data => {
        const ndviLink = this.agromonitoringService.getSentinel2NDVILink(data);
        if (ndviLink) {
          return of(ndviLink); // Devuelve el enlace NDVI si se encuentra
        } else {
          console.log('No se encontró el enlace NDVI para Sentinel-2.');
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
                layerControl.addOverlay(ndviLayerGroup, "<b><span style='color: #ba4806'>NDVI</span></b>"); // Añadir el LayerGroup al control de capas con un nombre específico
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

  showMap(property: Property, operations: Operation[]) {
    console.log(operations);
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove();
    }

    this.myMap = new Map('map').setView([0, 0], 14);
    const arcgisTileLayer = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    // this.getHeatMapData(this.heatDataArray);
    // console.log(this.heatDataArray)

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
    const overlayLayers: any = {
      'Operaciones riego': this.polygonLayer,
      'Sensores suelo': soilLayer,
      'Sensores ambiente': tempLayer,
      'Otros sensores': otherLayer,
    };
    
    if (this.heatmapLayerGroup) {
      overlayLayers["<b><span style='color: #015161'>Mapa de calor</span></b>"] = this.heatmapLayerGroup;
    }    

    //crea un control de capas 
    let layerControl = control.layers(baseLayers, overlayLayers).addTo(this.myMap);

    this.getAllImages(layerControl);

    // let poligonToGjson;
    let propertyStyle = { color: "#1ce5e8", weight: 2, opacity: 1, fillOpacity: 0.0 };
    // let bounds;

    // Poligono de la Propiedad
    let poligonObj = JSON.parse(property.geojson);
    let poligonToGjson = geoJSON(poligonObj, { style: propertyStyle }).addTo(this.myMap);
    let bounds = poligonToGjson.getBounds();
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
        console.log(ope.operationArea);

        let cropIcon;
        switch (ope.crop.cropName.toLowerCase()) {
          case 'durazno':
            cropIcon = 'assets/images/durazno.png';
            break;
          case 'vid vinífera':
            cropIcon = 'assets/images/grapes.png';
            break;
          // Agrega más casos según los cultivos que tengas
          default:
            cropIcon = 'assets/images/generalcrop.png'; // Icono predeterminado si no coincide con ninguno
            break;
        };

        poligon.bindPopup(`
        <div class="container text-center" style="width: 160px; line-height: 0.5; margin-left: 0px; margin-right: 0px; padding-right: 0px; padding-left: 0px;">
          <div class="row">
            <div class="col-12" style="line-height: 1;">
              <div class="text-center">
                <img src="assets/images/location.png" alt=""><br><br>
                Operacion: <b>${ope.operationName}</b><br><br>
              </div>
              <div class="text-center">
                <img src="assets/images/selection.png" alt=""> Superficie: <b>${formattedOperationArea} ha.</b><br>
              </div>
              <div class="text-center">
                <img src="${cropIcon}" alt=""> Cultivo: <b>${ope.crop.cropName}</b> <br>
              </div>
              ${dev ? `
                <div class="text-center">
                  Variedad: <b>${dev.devicesCultivo}</b><br>
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
    const addSoilMarker = (dev: Device, data: Data, icon) => {
      // Determine the text color based on the value of data.volt
      const textColor = data.volt < 3.2 ? 'red' : 'black';
      if (dev.devicesNombre == "lse"){
        let iconSoil = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
      <div class="container text-center" style="width: 200px; line-height: 0.5; margin-left: 0px; margin-right: 0px; padding-right: 0px; padding-left: 0px;">

          <div class="row">
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Dispositivo:<br><b>${dev.devicesNombre}</b></h5>
              </div>
            </div>
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Bateria:<br><b style="color: ${textColor};">${data.volt} V.</b></h5>
              </div>
            </div>
          </div>

          <div class="row">
            <div id="soilId" style="width: 100%; height: 150px;"></div>
          </div>

          <div class="row">
            <div class="col-12">
              <h2 style="margin-bottom: 0px; color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : icon === this.yellowIcon ? '#c9b802' : 'green'};">
                ${icon === this.redIcon ? 'PELIGRO' : icon === this.blueIcon ? 'SATURADO' : icon === this.yellowIcon ? 'PRECAUCIÓN' : 'OPTIMO'}
              </h2>
            </div>
          </div>

          <div class="row">
            <div class="col-4">
              <img src="assets/images/root32px.png" alt="">
            </div>
            <div class="col-8">
                  <h5 style="margin-bottom: 0px; margin-top: 5px; color: black; text-align: left;">30 cm: <b style="color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
                      ${data.dataHum}%
                    </b>
                  </h5>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">Ce:<br><img src="assets/images/water.png" alt=""> <b>${data.dataConducSoil} Mm</b></h5>
            </div>
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">Temp:<br><img src="assets/images/termometro.png" alt=""> <b>${data.dataTempSoil} °C</b></h5>
            </div>
          </div>

        </div>

        `, { closeButton: false }).on('click', (e) => {
        // console.log('Hiciste clic en el marcador', e.latlng);
        this.dataService.lastDatasByDeviceId(dev.devicesId, 10).subscribe(lastdata => {
          // console.log(lastdata);
          this.createMiniChart("soilId", lastdata, "#3eedd3", "dataHum")
        });
      });
      
      loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, dev.soil.cc, dev.soil.ur, dev.soil.pmp);
      soilLayer.addLayer(iconSoil);
      // this.lastData.push(data);
      }else {
        let iconSoil = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
      <div class="container text-center" style="width: 200px; line-height: 0.5; margin-left: 0px; margin-right: 0px; padding-right: 0px; padding-left: 0px;">

          <div class="row">
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Dispositivo:<br><b>${dev.devicesNombre}</b></h5>
              </div>
            </div>
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Bateria:<br><b style="color: ${textColor};">${data.volt} V.</b></h5>
              </div>
            </div>
          </div>

          <div class="row">
            <div id="soilId" style="width: 100%; height: 150px;"></div>
          </div>

          <div class="row">
            <div class="col-12">
              <h2 style="margin-bottom: 0px; color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : icon === this.yellowIcon ? '#c9b802' : 'green'};">
                ${icon === this.redIcon ? 'PELIGRO' : icon === this.blueIcon ? 'SATURADO' : icon === this.yellowIcon ? 'PRECAUCIÓN' : 'OPTIMO'}
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
                  <h5 style="margin-bottom: 0px; margin-top: 5px; color: black; text-align: left;">30 cm: <b style="color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
                      ${data.dataHum1}%
                    </b>
                  </h5>
                </div>
                <div class="col-12">
                  <h5 style="color: black; text-align: left;">60 cm: <b style="color: ${icon === this.redIcon ? 'red' : icon === this.blueIcon ? 'blue' : 'green'};">
                      ${data.dataHum2}%
                    </b>
                  </h5>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">HR:<br><img src="assets/images/water.png" alt=""> <b>${data.dataHr} %</b></h5>
            </div>
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">Temp:<br><img src="assets/images/termometro.png" alt=""> <b>${data.dataTemp} °C</b></h5>
            </div>
          </div>

        </div>

        `, { closeButton: false }).on('click', (e) => {
        // console.log('Hiciste clic en el marcador', e.latlng);
        this.dataService.lastDatasByDeviceId(dev.devicesId, 10).subscribe(lastdata => {
          // console.log(lastdata);
          this.createMiniChart("soilId", lastdata, "#3eedd3", "dataHum")
        });
      });
     
      loadLiquidFillGauge(`fillgauge${dev.devicesId}`, data.dataHum, dev.soil.cc, dev.soil.ur, dev.soil.pmp);
      soilLayer.addLayer(iconSoil);
      // this.lastData.push(data);
      }

    };

    // Function to add markers
    const addTempMarker = (dev: Device, data: Data, icon) => {
      // Determine the text color based on the value of data.volt
      const textColor = data.volt <= 3.2 ? 'red' : 'black';
      let iconTemp = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
      <div class="container text-center" style="width: 200px; line-height: 0.5; margin-left: 0px; margin-right: 0px; padding-right: 0px; padding-left: 0px;">

          <div class="row">
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Dispositivo:<br><b>${dev.devicesNombre}</b></h5>
              </div>
            </div>
            <div class="col-6">
              <div>
                <h5 style="color: black; margin-bottom: 0px;">Bateria:<br><b style="color: ${textColor};">${data.volt} V.</b></h5>
              </div>
            </div>
          </div>

          <div class="row">
            <div id="chartdiv" style="width: 100%; height: 150px;"></div>
          </div>

          <div class="row">
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">HR:<br><img src="assets/images/water.png" alt=""> <b>${data.dataHr}</b> %</h5>
            </div>
            <div class="col-6">
              <h5 style="color: black; margin-bottom: 0px;">Temp:<br><img src="assets/images/termometro.png" alt=""> <b>${data.dataTemp}</b> °C</h5>
            </div>
          </div>

        </div>
  
        `, { closeButton: false }).on('click', (e) => {
        // console.log('Hiciste clic en el marcador', e.latlng);
        this.dataService.lastDatasByDeviceId(dev.devicesId, 10).subscribe(lastdata => {
          console.log(lastdata);
          this.createMiniChart("chartdiv", lastdata, "#3eedd3", "dataTemp")
        });
      });
      tempLayer.addLayer(iconTemp);

    };

    // Function to add markers
    const addGaugeMarker = (dev: Device, data, icon) => {
      // Determine the text color based on the value of data.volt
      const textColor = data.volt <= 3.2 ? 'red' : 'black';
      let gaugeIcon = marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(`
      <div class="container text-center" style="width: 200px;line-height: 0.5;margin-left: 0px;margin-right: 0px;padding-right: 0px;padding-left: 0px;">
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
        <div id="chartdiv" style="width: 100%; height: 150px">
            </div>
            </div>    
            <div class="row">
            <div class="col-6">
              <h5 style="color: black;margin-bottom: 0px;">Presion:<br><img src="assets/images/pressure.png" alt=""> <b>${data.presion}</b> Kg/cm2</h5>
            </div>
            <div class="col-6">
              <h5 style="color: black;margin-bottom: 0px;">Caudal:<br><img src="assets/images/dial24.png" alt=""> <b>${data.flow}</b> m3/h</h5>
            </div>
          </div>
      </div>
      `, { closeButton: false }).on('click', (e) => {
        // console.log('Hiciste clic en el marcador', e.latlng);
        this.dataService.lastDatasByDeviceId(dev.devicesId, 10).subscribe(lastdata => {
          this.createMiniChart("chartdiv", lastdata, "#3eedd3", "flow")
        });
      });
      otherLayer.addLayer(gaugeIcon);
    };

    operations.forEach(ope => {
      ope.polygons.forEach(poly => {
        if (poly.devices.length === 0) {
          addPolygons(ope, "#302e2e");
        } else {
          poly.devices.forEach(dev => {
            this.devices.push(dev);
            this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(
              data => {
                const adt = dev.soil.cc - dev.soil.pmp;
                const wur = (adt * (dev.soil.ur / 100)) + dev.soil.pmp

                if (data.dataHum <= dev.soil.pmp) {
                  addSoilMarker(dev, data, this.redIcon);
                  addPolygons(ope, "#CB2B3E", this.redIcon, dev);
                } else if (data.dataHum >= dev.soil.cc) {
                  addSoilMarker(dev, data, this.blueIcon);
                  addPolygons(ope, "#0481bf", this.blueIcon, dev);
                } else if (data.dataHum > dev.soil.pmp && data.dataHum <= wur) {
                  addSoilMarker(dev, data, this.yellowIcon);
                  addPolygons(ope, "#CAC428", this.yellowIcon, dev);
                } else if (data.dataHum > wur && data.dataHum < dev.soil.cc) {
                  addSoilMarker(dev, data, this.greenIcon);
                  addPolygons(ope, "#2AAD27", this.greenIcon, dev);
                }
              },
              error => {
                console.log(error);
              }
            );
          });
        }
      })
    });

    property.devices.forEach(dev => {

      if (dev.devicesType === "Caudal") {
        this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
          addGaugeMarker(dev, data, this.gaugeIcon);
        })
      };
      if (dev.devicesType === "Temp.") {
        this.dataService.lastDataByDeviceId(dev.devicesId).subscribe(data => {
          const tempIcon = this.createTempIcon(data.dataTemp)
          this.lastDataTempArray.push(data)
          addTempMarker(dev, data, tempIcon);
        });
      }
    })

  };

  crearHeatMap(property: Property): Observable<void> {
    return new Observable<void>(observer => {
      if (!property.devices || !property.devices.length) {
        // Si no hay dispositivos, no necesitamos crear un heatmap, así que completamos el observable y salimos
        observer.next();
        observer.complete();
        return;
      };

      // Tu lógica existente para crear el heatmap
      const heatDataArray: HeatData[] = [];

      const observablesArray = property.devices
        .filter(dev => dev.devicesType === 'Temp.')
        .map(dev => this.dataService.lastDataByDeviceId(dev.devicesId)
          .pipe(
            catchError(error => {
              console.error(`Error obteniendo datos para el dispositivo ${dev.devicesId}`, error);
              return EMPTY; // Continuar con otras observables incluso si una falla
            })
          )
        );
      // forkJoin combina las observables en un solo observable cuando todas están completas
      forkJoin(observablesArray).subscribe((dataArray: Data[]) => {
     
        for (let i = 0; i < property.devices.length; i++) {
          dataArray.forEach(data => {
            const dev = property.devices[i];
            if (data.serie === dev.devicesSerie) {
              const heatData: HeatData = {
                lat: dev.latitud,
                lng: dev.longitud,
                count: data.dataTemp as number
                // Asegúrate de que data.dataTemp sea de tipo number
              };
              heatDataArray.push(heatData);
            }
          })
        }
        // Ahora heatDataArray está completo, puedes hacer lo que necesites con él
        this.heatDataArray = heatDataArray;

        // Llamar a getHeatMapData después de que heatDataArray se haya completado
        this.getHeatMapData(this.heatDataArray);

        // Notificar al observador
        observer.next();
        observer.complete();
      });
    });
  }

  // TODO ver el count de heatDataArray, que sea el ultimo valor de temp
  getHeatMapData(heatData: HeatData[]) {
    // Setting up heat layer config
    const heatLayerConfig = {
      "radius": .003,
      "maxOpacity": .8,
      "scaleRadius": true,
      // property below is responsible for colorization of heat layer
      "useLocalExtrema": true,
      // here we need to assign property value which represent lat in our data
      latField: 'lat',
      // here we need to assign property value which represent lng in our data
      lngField: 'lng',
      // here we need to assign property value which represent valueField in our data
      valueField: 'count'
    };

    // count: Math.floor(Math.random() * 6) + 25 // Generar un número aleatorio entre 25 y 30
    const heatDataObject = { data: heatData };
    // Initialising heat layer and passing config
    const heatmapLayer = new HeatmapOverlay(heatLayerConfig);

    //Passing data to a layer
    heatmapLayer.setData(heatDataObject);
    // Crear una nueva LayerGroup para el heatmap y agregar el heatmapLayer a esta capa
    this.heatmapLayerGroup = layerGroup([heatmapLayer]);
  }

  maybeDisposeRoot(divId) {
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root && root.dom.id == divId) {
        root.dispose();
      }
    });
  }

}
