import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Device } from '../../../core/models/device.models';

@Component({
  selector: 'app-form-edit',
  templateUrl: './form-edit.component.html',
  styleUrls: ['./form-edit.component.scss']
})
export class FormEditComponent implements OnInit {

  @ViewChild('opeGeojsonTextarea', { static: false }) opeGeojsonTextarea!: ElementRef;
  fechaActual: string;
  fechaAyer: string;
  fechaAntier: string;
  fechaAntiantier: string;
  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: any;
  devices: any[] = [];
  device: Device;
  propId: number;
  devId: number;
  myMap = null;
  ur: number = 11;
  wc: number = 17;
  lastData: number[] = [];
  opeGeojson: any;
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;

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
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private deviceService: DeviceService,
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Form Edit', active: true }];
    this.activatedRoute.snapshot.params['idProp'];
    this.activatedRoute.snapshot.params['idDev'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.devId = params['idDev'];
      this.getData(this.propId);
      this.buildForm();
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getData(id: number) {
    this.propertyService.getPropertyById(id).subscribe(data => {
      this.property = data;
      // console.log(this.property)
      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        // console.log(this.operations)
        this.createMap(this.property, this.operations)
      },
        (error) => {
          console.log(error);
        });
    });
  };
  // =========================================FORM============================================================
  private initForm() {
    this.form.patchValue({
      devicesNombre: this.device.devicesNombre,
      devicesCultivo: this.device.devicesCultivo,
      devicesSerie: this.device.devicesSerie,
      latitud: this.device.latitud,
      longitud: this.device.longitud,
      geojson: this.opeGeojson,
    });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      devicesNombre: ['', [Validators.required, Validators.maxLength(10)]],
      devicesCultivo: ['', [Validators.required, Validators.maxLength(10)]],
      devicesSerie: ['', [Validators.required, Validators.maxLength(25)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      geojson: [''],
    });
  }

  save() {
    if (this.form.valid) {
      this.deviceService.PutDevicesById(this.devId, this.form.value)
        .subscribe(
          response => {
            console.log(response);
            console.log('Solicitud HTTP PUT enviada correctamente');
          },
          error => {
            console.error('Error al enviar la solicitud HTTP PUT', error);
          }
        );
    } else {
      this.form.markAllAsTouched();
    }
  }
  // =========================================MAP==========================================================
  createMap(property, operations) {
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }
    // this.myMap = new Map('map').setView(property.coordenadas as [number, number], 15);
    this.myMap = new Map('mapEdit').setView([0, 0], 15);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(this.myMap);

    //Dibuja el poligono de la propiedad y centra el foco en esta.
    let propertyObj = JSON.parse(property.geojson);
    let propertyStyle = { color: "#e8e81c", weight: 2, opacity: 1, fillOpacity: 0.0 };
    let propertyToGjson = geoJSON(propertyObj, { style: propertyStyle }).addTo(this.myMap);
    this.myMap.fitBounds(propertyToGjson.getBounds());

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    // FeatureGroup is to store editable layers
    this.drawItems = new FeatureGroup();
    this.myMap.addLayer(this.drawItems);

    const drawControl = new Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        polyline: false,
        circlemarker: false,
        polygon: { allowIntersection: false, drawError: { color: 'red', timeout: 1000 } },
      },
      edit: {
        featureGroup: this.drawItems,
        remove: true
      }
    });

    this.myMap.addControl(drawControl);

    // Evento 'draw:created' para agregar nuevas capas al featureGroup
    // this.myMap.on('draw:created', (e) => {
    //   const layer = e.layer;
    //   console.log(layer.toGeoJSON());
    //   this.drawnItems.addLayer(layer);
    // });

    // Evento 'draw:edited' para editar capas del featureGroup
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        console.log(layer.toGeoJSON());
        this.opeGeojson = layer.toGeoJSON();
        this.opeGeojsonTextarea.nativeElement.value = JSON.stringify(this.opeGeojson);
      });
    });

    operations.forEach(ope => {
      
      ope.devices.forEach(dev => {

        if (dev.devicesId == this.devId) {
          this.device = dev;
          this.opeGeojson = ope.operationGeojson;

          // Agregar capas al featureGroup desde un objeto GeoJSON
          geoJSON(JSON.parse(this.opeGeojson), {
            onEachFeature: (feature, layer) => {
              this.drawItems.addLayer(layer);
            }
          }).addTo(this.myMap);

          this.initForm();

          marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap);

        } else {

          let operationObj = JSON.parse(ope.operationGeojson);
          let operationStyleGrey = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };
          let operationToGjson = geoJSON(operationObj, { style: operationStyleGrey }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

        }
      });
    });
  };

  get nameField() {
    return this.form.get('devicesNombre');
  }

  get isNameFieldValid() {
    return this.nameField.touched && this.nameField.valid;
  }

  get isNameFieldInvalid() {
    return this.nameField.touched && this.nameField.invalid;
  }

  get isVarietyFieldValid() {
    return this.varietyField.touched && this.varietyField.valid;
  }

  get isVarietyFieldInvalid() {
    return this.varietyField.touched && this.varietyField.invalid;
  }

  get varietyField() {
    return this.form.get('devicesCultivo')
  }

  get serieField() {
    return this.form.get('devicesSerie');
  }

  get isSerieFieldValid() {
    return this.serieField.touched && this.serieField.valid;
  }

  get isSerieFieldInvalid() {
    return this.serieField.touched && this.serieField.invalid;
  }

  get latitudField() {
    return this.form.get('latitud')
  }
  get isLatitudFieldValid() {
    return this.latitudField.touched && this.latitudField.valid;
  }
  get isLatitudFieldInvalid() {
    return this.latitudField.touched && this.latitudField.invalid;
  }
  get longitudField() {
    return this.form.get('longitud')
  }
  get isLongitudFieldValid() {
    return this.longitudField.touched && this.longitudField.valid;
  }
  get isLongitudFieldInvalid() {
    return this.longitudField.touched && this.longitudField.invalid;
  }
}

