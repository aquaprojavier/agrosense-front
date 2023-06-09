import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { MyValidators } from 'src/app/utils/validators';
import { formatDate } from '@angular/common';
import { geoJSON, Icon, LatLng, Map, marker, tileLayer } from 'leaflet';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { CargarService } from 'src/app/core/services/cargar.service'
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-form-edit',
  templateUrl: './form-edit.component.html',
  styleUrls: ['./form-edit.component.scss']
})
export class FormEditComponent implements OnInit {

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
  devId: any;
  myMap = null;
  ur: number = 11;
  wc: number = 17;
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

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private dataService: DataService,
    private cargaScript: CargarService,) {

    this.cargaScript.carga(["loadFillGauge"]);
    this.buildForm();
  }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Form Edit', active: true }];
    this.activatedRoute.snapshot.params['idProp'];
    this.activatedRoute.snapshot.params['idDev'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.devId = params['idDev'];
      this.getData(this.propId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getData(id: number) {
    this.propertyService.getPropertyById(id).subscribe(data => {
      this.property = data;
      console.log(this.property)
      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        console.log(this.operations)
        this.createMap(this.property, this.operations)
      })
    });
  };

  createMap(property, operations) {
    if (this.myMap !== undefined && this.myMap !== null) {
      this.myMap.remove(); // should remove the map from UI and clean the inner children of DOM element
    }
    // this.myMap = new Map('map').setView(property.coordenadas as [number, number], 15);
    this.myMap = new Map('mapEdit').setView([0, 0], 15);
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

    // this.devices = [];

    operations.forEach(ope => {

      ope.devices.forEach(dev => {
        console.log(dev.devicesId)
        // this.devices.push(dev);
        if (dev.devicesId == this.devId){
          marker(dev.coordenadas, { icon: this.greenIcon }).addTo(this.myMap);

            let operacionStyle = { color: "#2AAD27" };
            let poligonDevice = JSON.parse(ope.operationGeojson);
            let poligon = geoJSON(poligonDevice, { style: operacionStyle }).addTo(this.myMap);
            poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)
        }

        
      });
    });
  };


  private buildForm() {
    this.form = this.formBuilder.group({
      fullname: this.formBuilder.group({
        name: ['', [Validators.required, Validators.maxLength(10)]],
        lastname: ['', [Validators.required, Validators.maxLength(10)]],
      }),
      password: ['', [Validators.required, Validators.minLength(5), MyValidators.validPassword]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      color: ['#000000'],
      age: ['12', [Validators.required, Validators.min(18), Validators.max(100)]],
      date: [''],
      category: ['one']
    });
  }

  get nameField() {
    return this.form.get('fullname.name');
  }

  get lastnameField() {
    return this.form.get('fullname.lastname');
  }

  get isNameFieldValid() {
    return this.nameField.touched && this.nameField.valid;
  }

  get isNameFieldInvalid() {
    return this.nameField.touched && this.nameField.invalid;
  }

  get passwordField() {
    return this.form.get('password')
  }

  get emailField() {
    return this.form.get('email')
  }
  get dateField() {
    return this.form.get('date')
  }
  get phoneField() {
    return this.form.get('phone')
  }
  get colorField() {
    return this.form.get('color')
  }
  get ageField() {
    return this.form.get('age')
  }
  get categoryField() {
    return this.form.get('category')
  }
  get tagField() {
    return this.form.get('tag')
  }

  save(event) {
    if (this.form.valid) {
      console.log(this.form.value)
    } else {
      this.form.markAllAsTouched();
    }

  }

}

