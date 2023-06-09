import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Popup } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DeviceEdit } from 'src/app/core/models/deviceEdit.models';
import { DeviceService } from 'src/app/core/services/device.service';
import { DataService } from 'src/app/core/services/data.service';
import { SoilService } from 'src/app/core/services/soil.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Operation } from 'src/app/core/models/operation.models';
import { Soil } from '../../../core/models/soil.model';

@Component({
  selector: 'app-create-device',
  templateUrl: './create-device.component.html',
  styleUrls: ['./create-device.component.scss']
})
export class CreateDeviceComponent implements OnInit {

  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: Operation[];
  device: Device;
  deviceEdit: DeviceEdit;
  opeId: number;
  propId: number;
  devId: number;
  myMap = null;
  opeGeojson: any;
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;
  latitud: number;
  longitud: number;
  serialNumbers: string[] = [];
  soils: Soil[] = [];
  
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

  constructor(private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private deviceService: DeviceService,
    private dataService: DataService,
    private soilService: SoilService,
    private router: Router,) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Device' }, { label: 'Create', active: true }];
    this.activatedRoute.snapshot.params['idProp'];
    this.getFreeSerialNumber("draginonestor");
    this.getSoils();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.getData(this.propId);
      this.buildForm();
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getSoils() {
    this.soilService.GetSoils().subscribe(data => {
      this.soils = data;
    })
  }

  getData(id: number) {
    this.propertyService.getPropertyById(id).subscribe(data => {
      this.property = data;
      // console.log(this.property)
      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        console.log(this.operations)
        this.createMap(this.property, this.operations)
      },
        (error) => {
          console.log(error);
        });
    });
  };

  getFreeSerialNumber(serialId: string){
    this.dataService.getSerialNumber(serialId).subscribe(data => {
      this.serialNumbers = data;
    })
  }
  // =========================================FORM============================================================

  private buildForm() {
    this.form = this.formBuilder.group({
      devicesNombre: ['', [Validators.required, Validators.maxLength(20)]],
      devicesCultivo: ['', [Validators.required, Validators.maxLength(20)]],
      devicesSerie: ['', [Validators.required, Validators.maxLength(25)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      opeId: ['', Validators.required],
      soil: ['', Validators.required],
    });
  }

  saveDevice() {
    if (this.form.valid) {
      this.operations.forEach(ope => {
        if (this.form.value.opeId == ope.operationId){
          this.opeGeojson = ope.operationGeojson
        }
      })
      const deviceDto: Device = {
        devicesNombre: this.form.value.devicesNombre,
        devicesCultivo: this.form.value.devicesCultivo,
        devicesSerie: this.form.value.devicesSerie,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud,
        operationId: this.form.value.opeId,
        soil: this.form.value.soil
      };
      console.log(deviceDto);
      this.deviceService.createDevice({ data: deviceDto }).subscribe(
        // this.deviceService.PutDevicesEditById(this.devId, this.opeId, deviceEdit).subscribe(
        (response: Device) => {

          console.log('Se ha creado el dispositivo exitosamente:', response);

          Swal.fire('Creación exitosa!', `El dispositivo ${deviceDto.devicesNombre} fue creado correctamente`, 'success')
            .then(() => {
              this.router.navigate([`dashboard/leaflet/${this.propId}`]); // Redirige a la página principal
            });
        },
        error => {
          console.error('Error en la respuesta del backend:', error);
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

    const drawControl = new Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        polyline: false,
        circlemarker: false,
        polygon: false,
      },
      edit: {
        featureGroup: this.drawItems,
        remove: true
      }
    });

    this.myMap.addControl(drawControl);
    this.myMap.addLayer(this.drawItems);


    // Evento 'draw:created' para agregar nuevas capas al featureGroup
    this.myMap.on('draw:created', (e) => {
      let type = e.layerType;
      const layer = e.layer;
      if (type === 'marker'){
        console.log(type);
      let coordenadas = layer.toGeoJSON().geometry.coordinates;
      this.longitud = coordenadas[0];
      this.latitud = coordenadas[1];
      console.log(this.latitud);
      console.log(this.longitud);
      };      
      // this.opeGeojson = JSON.stringify(layer.toGeoJSON());
      this.drawItems.addLayer(layer);
    });

    // // Evento 'draw:edited' para editar capas del featureGroup
    // this.myMap.on('draw:edited', (e) => {
    //   const layers = e.layers;
    //   layers.eachLayer((layer) => {
    //     this.opeGeojson = JSON.stringify(layer.toGeoJSON());
    //   });
    // });

    operations.forEach(ope => {
      if (ope.devices && ope.devices.length === 0) {
        let operacionStyle = { color: "#7B7B7B" };
        let poligonDevice = JSON.parse(ope.operationGeojson);
       let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`,{ closeButton: false })
      }
      ope.devices.forEach(dev => {

          marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);

          let operationObj = JSON.parse(ope.operationGeojson);
          let operationStyleGrey = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };
          let operationToGjson = geoJSON(operationObj, { style: operationStyleGrey }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`,{ closeButton: false })

        // }
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
  get opeIdField(){
    return this.form.get('opeId')
  }
  get isOpeIdFieldValid() {
    return this.opeIdField.touched && this.opeIdField.valid;
  }
  get isOpeIdFieldInvalid() {
    return this.opeIdField.touched && this.opeIdField.invalid;
  }
}
