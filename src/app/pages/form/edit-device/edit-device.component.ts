import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Marker } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DataService } from 'src/app/core/services/data.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Soil } from 'src/app/core/models/soil.model';
import { Operation } from 'src/app/core/models/operation.models';
import { Property } from 'src/app/core/models/property.models';
import { DeviceDto } from 'src/app/core/models/deviceDto.models';
import { IconService } from 'src/app/core/services/icon.service';

@Component({
  selector: 'app-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit {

  // @ViewChild('opeGeojsonTextarea', { static: false }) opeGeojsonTextarea!: ElementRef;
  gaugeIcon: Icon;
  redIcon: Icon;
  greenIcon: Icon;
  blueIcon: Icon;
  greyIcon: Icon;
  breadCrumbItems: Array<{}>;
  user: User;
  property: Property;
  operations: Operation[];
  device: Device;
  // deviceEdit: DeviceEdit;
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
  soils: Soil[] = [];
  devicesList = ['Suelo', 'Temp. / HR', 'Caudalimetro', 'Estación meteorológica']; // Lista de tipos de dispositivos
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
  psmOptions: number[] = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]

  constructor(
    private iconService: IconService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private deviceService: DeviceService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Device' }, { label: 'Edit', active: true }];
    this.getIcons();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.devId = params['idDev'];
      this.deviceService.getDeviceById(this.devId).subscribe(dev => {
        this.device = dev;
        console.log(dev);
      })
      this.getData(this.propId);
      // this.getSoils();
      this.buildForm();
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getIcons(){
    this.gaugeIcon = this.iconService.getGaugeIcon();
    this.redIcon = this.iconService.getRedIcon();
    this.greenIcon = this.iconService.getGreenIcon();
    this.blueIcon = this.iconService.getBlueIcon();
  }

  getData(propId: number) {
    this.propertyService.getPropertyById(propId).subscribe(data => {
      this.property = data;
      // console.log(this.property)
      this.operationService.getOperationsByPropertyId(propId).subscribe(datas => {
        this.operations = datas;
        this.opeId = this.getOpeIdSameAsDevId(this.operations, this.devId.toString())
        this.showMap(this.property, this.operations)
      },
        (error) => {
          console.log(error);
        });
    },
      (error) => {
        console.log(error);
      });
  };
  // =========================================FORM============================================================
  private initForm() {
    this.form.patchValue({
      devicesTipo: this.device.devicesType,
      devicesNombre: this.device.devicesNombre,
      devicesCultivo: this.device.devicesType === 'Suelo' ? this.device.devicesCultivo : null,
      devicesSerie: this.device.devicesSerie,
      latitud: this.device.latitud,
      longitud: this.device.longitud,
 
      opeId: this.device.devicesType === 'Suelo' ? this.opeId : null,
      soilType: this.device.devicesType === 'Suelo' ? this.device.soil.soilType : null,
      rootDepth: this.device.devicesType === 'Suelo' ? this.device.soil.depth : null,
      stone: this.device.devicesType === 'Suelo' ? this.device.soil.stone : null, 
      cc: this.device.devicesType === 'Suelo' ? this.device.soil.cc : null,
      ur: this.device.devicesType === 'Suelo' ? this.device.soil.ur : null,
      pmp: this.device.devicesType === 'Suelo' ? this.device.soil.pmp : null
    });
  }

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
      stone: ['', [Validators.required]], // Agregar campo 'cc' con validación requerida
      cc: ['', [Validators.required]], // Agregar campo 'cc' con validación requerida
      ur: ['', [Validators.required]], // Agregar campo 'ur' con validación requerida
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

  upDateDev() {
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

      if (devicesType === "Suelo") {
        operationId = this.form.value.opeId;
        devicesCultivo = this.form.value.devicesCultivo;

        const soilType = this.form.value.soilType;
        const root = this.form.value.rootDepth;
        const stone = this.form.value.stone;
        const cc = this.form.value.cc;
        const ur = this.form.value.ur;
        const pmp = this.form.value.pmp;
        const psm = this.form.value.psm;
        //Crear objeto soil
        soil = {
          soilType: soilType,
          depth: root,
          stone: stone,
          cc: cc,
          ur: ur,
          pmp: pmp
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

      this.deviceService.editDevice(this.devId, deviceDto).subscribe(
        (response: Device) => {

          console.log('Se ha guardado el formulario exitosamente:', response);

          Swal.fire('Edición exitosa!', `El dispositivo ${this.form.value.devicesNombre} se actualizó correctamente`, 'success')
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

  getOpeIdSameAsDevId(Opes: Operation[], id: string): number | number {
    for (const ope of Opes) {
      for (const dev of ope.devices) {
        if (dev.devicesId.toString() === id) {
          return ope.operationId;
        }
      }
    }
    return -1; // Retorno si no se encuentra ninguna coincidencia
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
        marker: false
      },
      edit: {
        featureGroup: this.drawItems,
        remove: true
      }
    });

    this.myMap.addControl(drawControl);
    this.myMap.addLayer(this.drawItems);

    this.editMarker();

    const id = this.getOpeIdSameAsDevId(this.operations, this.devId.toString())
    console.log(id)
    if (id === -1) {
      let latitude = this.device.latitud;
      let longitude = this.device.longitud;
      // Crear un marcador con la latitud y longitud del objeto
      const myMarker = marker([latitude, longitude], {icon: this.blueIcon});
      // Agregar el marcador al featureGroup
      this.drawItems.addLayer(myMarker);
    }

    let operacionStyleGrey = { color: "#7B7B7B" };
    operations.forEach(ope => {

      if (ope.operationId != id) {

        ope.polygons.forEach(poli => {
          let poligonDevice = JSON.parse(poli.geojson);
          let poligon = geoJSON(poligonDevice, { style: operacionStyleGrey }).addTo(this.myMap);
          poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        });

      } else {

        const operationStyleEdit = { color: "#11ede6" };
        let latitude = this.device.latitud;
        let longitude = this.device.longitud;

        // Crear un marcador con la latitud y longitud del objeto
        const myMarker = marker([latitude, longitude], {icon: this.blueIcon});
        // Agregar el marcador al featureGroup
        this.drawItems.addLayer(myMarker);

        ope.polygons.forEach(poly => {
          let operationObj = JSON.parse(poly.geojson);
          let operationToGjson = geoJSON(operationObj, { style: operationStyleEdit }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${this.device.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)
        });
      }
      this.drawItems.addTo(this.myMap);

    });
    this.initForm();
  };

  editMarker() {
    // Evento 'draw:edited' para editar capas del featureGroup
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        if (layer instanceof Marker) {
          const coordenadas = layer.getLatLng();
          // Redondear los valores de latitud y longitud a 4 decimales
          const roundedLat = this.roundToDecimal(coordenadas.lat, 6);
          const roundedLng = this.roundToDecimal(coordenadas.lng, 6);

          // Actualizar los valores en el formulario
          this.form.patchValue({
            latitud: roundedLat,
            longitud: roundedLng
          });
          console.log(coordenadas)
        }
        // No es necesario agregar la capa al featureGroup nuevamente, ya que ya está allí debido a la edición.
      });
    });
  }

  // Función para redondear a un número específico de decimales
  roundToDecimal(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }


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
  get psmField() {
    return this.form.get('psm');
  }
  get isPsmFieldValid() {
    return this.psmField.touched && this.psmField.valid;
  }
  get isPsmFieldInvalid() {
    return this.psmField.touched && this.psmField.invalid;
  }
}

