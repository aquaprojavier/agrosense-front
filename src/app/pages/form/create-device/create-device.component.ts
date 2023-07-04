import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Popup } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DeviceEdit } from 'src/app/core/models/deviceEdit.models';
import { DeviceService } from 'src/app/core/services/device.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-device',
  templateUrl: './create-device.component.html',
  styleUrls: ['./create-device.component.scss']
})
export class CreateDeviceComponent implements OnInit {

  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: any;
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

  greenIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
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
    private router: Router,) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Create', active: true }];
    this.activatedRoute.snapshot.params['idProp'];
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
  // =========================================FORM============================================================
  // private initForm() {
  //   this.form.patchValue({
  //     devicesNombre: this.device.devicesNombre,
  //     devicesCultivo: this.device.devicesCultivo,
  //     devicesSerie: this.device.devicesSerie,
  //     latitud: this.device.latitud,
  //     longitud: this.device.longitud,
  //   });
  // }

  private buildForm() {
    this.form = this.formBuilder.group({
      devicesNombre: ['', [Validators.required, Validators.maxLength(10)]],
      devicesCultivo: ['', [Validators.required, Validators.maxLength(10)]],
      devicesSerie: ['', [Validators.required, Validators.maxLength(25)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      opeId: ['', Validators.required],
    });
  }

  createDevAndPol() {
    if (this.form.valid) {
      this.operations.forEach(ope => {
        if (this.form.value.opeId == ope.operationId){
          this.opeGeojson = ope.operationGeojson
        }
      })
      const deviceEdit: DeviceEdit = {
        devicesNombre: this.form.value.devicesNombre,
        devicesCultivo: this.form.value.devicesCultivo,
        devicesSerie: this.form.value.devicesSerie,
        latitud: this.form.value.latitud,
        longitud: this.form.value.longitud,
        operationId: this.form.value.opeId,
        operationGeojson: this.opeGeojson
      };
      console.log(deviceEdit);
      this.deviceService.CreateDeviceAndPol( deviceEdit.operationId, deviceEdit ).subscribe(
        // this.deviceService.PutDevicesEditById(this.devId, this.opeId, deviceEdit).subscribe(
        (response: Device) => {

          console.log('Se ha creado el dispositivo exitosamente:', response);

          Swal.fire('Creación exitosa!', `El dispositivo ${deviceEdit.devicesNombre} fue creado correctamente`, 'success')
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

    // let popup = new Popup().setLatLng().setContent('<p>Hello world!<br />This is a nice popup.</p>').openOn(this.myMap);

    this.myMap.on('click', (event) => {
      const latLng = event.latlng;
      marker(latLng).addTo(this.myMap)
        .bindPopup(`<b>Latitud:</b> ${latLng.lat}<br><b>Longitud:</b> ${latLng.lng}`)
        .openPopup();
    });

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
        polygon: { allowIntersection: false, drawError: { color: 'red', timeout: 1000 } },
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
      const layer = e.layer;
      console.log(layer.toGeoJSON());
      this.opeGeojson = JSON.stringify(layer.toGeoJSON());
      this.drawItems.addLayer(layer);
    });


    // Evento 'draw:edited' para editar capas del featureGroup
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        this.opeGeojson = JSON.stringify(layer.toGeoJSON());
      });
    });

    operations.forEach(ope => {
      if (ope.devices && ope.devices.length === 0) {
        let operacionStyle = { color: "#7B7B7B" };
        let poligonDevice = JSON.parse(ope.operationGeojson);
       let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
        poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)
      }
      ope.devices.forEach(dev => {

        // if (dev.devicesId == this.devId) {
        //   this.device = dev;
        //   this.opeGeojson = ope.operationGeojson;
        //   this.opeId = ope.operationId;
        //   // Agregar capas al featureGroup desde un objeto GeoJSON
        //   geoJSON(JSON.parse(this.opeGeojson), {
        //     onEachFeature: (feature, layer) => {
        //       this.drawItems.addLayer(layer);
        //     }
        //   }).addTo(this.myMap);

        //   // this.initForm();

        //   marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap);

        // } else {

          let operationObj = JSON.parse(ope.operationGeojson);
          let operationStyleGrey = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };
          let operationToGjson = geoJSON(operationObj, { style: operationStyleGrey }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

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
