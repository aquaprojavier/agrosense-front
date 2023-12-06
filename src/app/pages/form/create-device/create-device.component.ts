import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Popup } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DeviceDto } from 'src/app/core/models/deviceDto.models';
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
  deviceDto: DeviceDto;
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
  
  devicesList = ['Suelo', 'Temp. / HR', 'Caudalimetro', 'Estación meteorológica']; // Lista de tipos de dispositivos
  soil: Soil;
  soilType: string[] = [
    "Arenoso",
    "Franco-arenoso",
    "Franco",
    "Franco-arcilloso",
    "Arcillo-limoso",
    "Arcilloso",
    // Agrega más tipos de suelo según tus necesidades
  ];
  stoneOptions: number[] = [90, 80, 70, 60, 50, 40, 20, 10, 5, 0];


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
    // this.getSoils();
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
      this.operationService.getOperationsByPropertyId(id).subscribe(data => {
        this.operations = data;
        console.log(this.operations)
        this.showMap(this.property, this.operations)
      },
        (error) => {
          console.log(error);
        });
    });
  };

  getFreeSerialNumber(serialId: string) {
    this.dataService.getSerialNumber(serialId).subscribe(data => {
      this.serialNumbers = data;
    })
  }
  // =========================================FORM============================================================

  private buildForm() {
    this.form = this.formBuilder.group({
      devicesNombre: ['', [Validators.required, Validators.maxLength(20)]],
      devicesSerie: ['', [Validators.required, Validators.maxLength(25)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      devicesTipo: '',

      devicesCultivo: ['', [Validators.required, Validators.maxLength(40)]],
      opeId: ['', Validators.required],
      soilType: ['', [Validators.required]], // Agregar campo 'soilType' con validación requerida
      rootDepth: ['', [Validators.required]], // Agregar campo 'root' con validación requerida
      stone: [0, [Validators.required]], // Agregar campo 'cc' con validación requerida
      cc: ['', [Validators.required]], // Agregar campo 'cc' con validación requerida
      ur: [50, [Validators.required]], // Agregar campo 'ur' con validación requerida
      pmp: ['', [Validators.required]], // Agregar campo 'pmp' con validación requerida
    });

    // Controlamos los cambios en devicesTipo para mostrar u ocultar los campos adicionales
    this.form.get('devicesTipo').valueChanges.subscribe((selectedType: string) => {
      if (selectedType === 'Suelo') {
        this.form.get('devicesCultivo').setValidators([Validators.required, Validators.maxLength(40)]);
        this.form.get('devicesCultivo').updateValueAndValidity();
        this.form.get('opeId').setValidators(Validators.required);
        this.form.get('opeId').updateValueAndValidity();
        this.form.get('soilType').setValidators(Validators.required);
        this.form.get('soilType').updateValueAndValidity();
        this.form.get('rootDepth').setValidators(Validators.required);
        this.form.get('rootDepth').updateValueAndValidity();
        this.form.get('stone').setValidators(Validators.required);
        this.form.get('stone').updateValueAndValidity();
        this.form.get('cc').setValidators(Validators.required);
        this.form.get('cc').updateValueAndValidity();
        this.form.get('ur').setValidators(Validators.required);
        this.form.get('ur').updateValueAndValidity();
        this.form.get('pmp').setValidators(Validators.required);
        this.form.get('pmp').updateValueAndValidity();
      } else {
        this.form.get('devicesCultivo').clearValidators();
        this.form.get('devicesCultivo').updateValueAndValidity();
        this.form.get('opeId').clearValidators();
        this.form.get('opeId').updateValueAndValidity();
        this.form.get('soilType').clearValidators();
        this.form.get('soilType').updateValueAndValidity();
        this.form.get('rootDepth').clearValidators();
        this.form.get('rootDepth').updateValueAndValidity();
        this.form.get('stone').clearValidators();
        this.form.get('stone').updateValueAndValidity();
        this.form.get('cc').clearValidators();
        this.form.get('cc').updateValueAndValidity();
        this.form.get('ur').clearValidators();
        this.form.get('ur').updateValueAndValidity();
        this.form.get('pmp').clearValidators();
        this.form.get('pmp').updateValueAndValidity();
      }
    });

    this.form.get('opeId').valueChanges.subscribe((selectedOpeId: number) => {
      this.operations.forEach(ope => {
        if (ope.operationId === selectedOpeId) {
          this.form.get('soilType').setValue(ope.soil.soilType);
          this.form.get('rootDepth').setValue(ope.soil.depth);
          this.form.get('stone').setValue(ope.soil.stone);
          this.form.get('cc').setValue(ope.soil.cc);
          this.form.get('ur').setValue(ope.soil.ur);
          this.form.get('pmp').setValue(ope.soil.pmp);
        }
      })
    });

    this.form.get('soilType').valueChanges.subscribe((selectedSoilType: string) => {
      switch (selectedSoilType) {
        case 'Arenoso':
          this.form.get('cc').setValue(9);
          this.form.get('pmp').setValue(4);
          break;
        case 'Franco-arenoso':
          this.form.get('cc').setValue(14);
          this.form.get('pmp').setValue(6);
          break;
        case 'Franco':
          this.form.get('cc').setValue(22);
          this.form.get('pmp').setValue(10);
          break;
        case 'Franco-arcilloso':
          this.form.get('cc').setValue(27);
          this.form.get('pmp').setValue(13);
          break;
        case 'Arcillo-limoso':
          this.form.get('cc').setValue(31);
          this.form.get('pmp').setValue(15);
          break;
        case 'Arcilloso':
          this.form.get('cc').setValue(35);
          this.form.get('pmp').setValue(17);
          break;
        default:
          this.form.get('cc').reset();
          this.form.get('pmp').reset();
          break;
      }
    });
  }

  saveDevice() {
    if (this.form.valid) {
      this.operations.forEach(ope => {
        if (this.form.value.opeId == ope.operationId) {
          this.opeGeojson = ope.polygons[0] //ver esto, se asigna al 1er poligono de la operacion
        }
      });
      
      const devicesNombre = this.form.value.devicesNombre;
      const devicesType = this.form.value.devicesTipo;
      const devicesSerie = this.form.value.devicesSerie;
      const latitud = this.form.value.latitud;
      const longitud = this.form.value.longitud;
      const propertyId = this.propId;
      let operationId = null;
      let devicesCultivo = null;
      let soil: Soil = null;

      if (devicesType === "Suelo"){
      operationId = this.form.value.opeId;
      devicesCultivo = this.form.value.devicesCultivo;

      const soilType = this.form.value.soilType;
      const root = this.form.value.rootDepth;
      const stone = this.form.value.stone;
      const cc = this.form.value.cc;
      const ur = this.form.value.ur;
      const pmp = this.form.value.pmp;

      //Crear objeto soil
      soil = {
        soilType: soilType,
        depth: root,
        stone: stone,
        cc: cc,
        ur: ur,
        pmp: pmp,
      };
      }
      
      const deviceDto: DeviceDto = {
        devicesNombre: devicesNombre,
        devicesType: devicesType,
        devicesSerie: devicesSerie,
        latitud: latitud,
        longitud: longitud,
        propertyId: propertyId,

        devicesCultivo: devicesCultivo,
        operationId: operationId,
        soil: soil
      };
     
      console.log(deviceDto);
      this.deviceService.createDevice({ data: deviceDto }).subscribe(
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
  showMap(property, operations) {

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
      if (type === 'marker') {
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

    let operationStyleGrey = { color: "#7B7B7B" };
    let operationStyleYellow = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };

    operations.forEach(ope => {
      if (ope.devices && ope.devices.length === 0) {
        ope.polygons.forEach(poly => {
          let poligonDevice = JSON.parse(poly.geojson);
          let poligon = geoJSON(poligonDevice, { style: operationStyleGrey }).addTo(this.myMap);
          poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        })
      }
      ope.devices.forEach(dev => {

        marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);

        ope.polygons.forEach(poly => {
          let operationObj = JSON.parse(poly.geojson);
          let operationToGjson = geoJSON(operationObj, { style: operationStyleYellow }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        });
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
  get opeIdField() {
    return this.form.get('opeId')
  }
  get isOpeIdFieldValid() {
    return this.opeIdField.touched && this.opeIdField.valid;
  }
  get isOpeIdFieldInvalid() {
    return this.opeIdField.touched && this.opeIdField.invalid;
  }
  get stoneField() {
    return this.form.get('stone');
  }
  get isStoneFieldValid() {
    return this.stoneField.touched && this.stoneField.valid;
  }
  get isStoneFieldInvalid() {
    return this.stoneField.touched && this.stoneField.invalid;
  }
  get soilTypeField() {
    return this.form.get('soilType');
  }
  get isSoilTypeFieldValid() {
    return this.soilTypeField.touched && this.soilTypeField.valid;
  }
  get isSoilTypeFieldInvalid() {
    return this.soilTypeField.touched && this.soilTypeField.invalid;
  }
  get rootDepthField() {
    return this.form.get('rootDepth');
  }
  get isRootDepthFieldValid() {
    return this.rootDepthField.touched && this.rootDepthField.valid;
  }
  get isRootDepthFieldInvalid() {
    return this.rootDepthField.touched && this.rootDepthField.invalid;
  }
  get ccField() {
    return this.form.get('cc');
  }
  get isCcFieldValid() {
    return this.ccField.touched && this.ccField.valid;
  }
  get isCcFieldInvalid() {
    return this.ccField.touched && this.ccField.invalid;
  }
  get urField() {
    return this.form.get('ur');
  }
  get isUrFieldValid() {
    return this.urField.touched && this.urField.valid;
  }
  get isUrFieldInvalid() {
    return this.urField.touched && this.urField.invalid;
  }
  get pmpField() {
    return this.form.get('pmp');
  }
  get isPmpFieldValid() {
    return this.pmpField.touched && this.pmpField.valid;
  }
  get isPmpFieldInvalid() {
    return this.pmpField.touched && this.pmpField.invalid;
  }
}
