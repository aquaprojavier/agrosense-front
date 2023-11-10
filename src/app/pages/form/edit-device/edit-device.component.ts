import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Marker } from 'leaflet';
import 'leaflet-draw';
import { SoilService } from 'src/app/core/services/soil.service';
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


@Component({
  selector: 'app-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit {

  // @ViewChild('opeGeojsonTextarea', { static: false }) opeGeojsonTextarea!: ElementRef;

  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
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

  greenIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
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
    private soilService: SoilService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Device' }, { label: 'Edit', active: true }];
    // this.activatedRoute.snapshot.params['idProp'];
    // this.activatedRoute.snapshot.params['idDev'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.devId = params['idDev'];
      console.log('+++++++++');
      console.log(this.devId);
      this.getData(this.propId);
      this.getSoils();
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
        // console.log(this.operations)
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
      devicesNombre: this.device.devicesNombre,
      devicesCultivo: this.device.devicesCultivo,
      devicesSerie: this.device.devicesSerie,
      latitud: this.device.latitud,
      longitud: this.device.longitud,
      operationId: this.opeId,
      soilId: this.device.soil.id//TODO ver esto!
    });
    console.log(this.device.soil.id)
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      devicesNombre: ['', [Validators.required, Validators.maxLength(20)]],
      devicesCultivo: ['', [Validators.required, Validators.maxLength(40)]],
      devicesSerie: ['', [Validators.required, Validators.maxLength(25)]],
      latitud: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      operationId: ['', Validators.required],
      soilId: ['', Validators.required],
    });
  }

  upDateDev() {
    if (this.form.valid) {
      console.log(this.form.value);
      
      this.deviceService.editDevice(this.devId, this.form.value).subscribe(
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

    this.editPolygon();

    let operationStyleEdit = { color: "#11ede6" };
    let operacionStyleGrey = { color: "#7B7B7B" };
    operations.forEach(ope => {
      
        ope.polygons.forEach(poli => {
          let poligonDevice = JSON.parse(poli.geojson);
          let poligon = geoJSON(poligonDevice, { style: operacionStyleGrey }).addTo(this.myMap);
          poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        });

      property.devices.forEach(dev => {

        if (dev.devicesId == this.devId) {

          this.device = dev;
          let latitude = this.device.latitud;
          let longitude = this.device.longitud;

          // Crear un marcador con la latitud y longitud del objeto
          const myMarker = marker([latitude, longitude]);
          // Agregar el marcador al featureGroup
          this.drawItems.addLayer(myMarker);

          this.opeId = ope.operationId;

          ope.polygons.forEach(poly => {
            let operationObj = JSON.parse(poly.geojson);
            let operationToGjson = geoJSON(operationObj, { style: operationStyleEdit }).addTo(this.myMap);
            operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)
          });
          this.drawItems.addTo(this.myMap);

        } 
      });
    });
    this.initForm();
  };

  editPolygon() {
    // Evento 'draw:edited' para editar capas del featureGroup
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        if (layer instanceof Marker) {
          const coordenadas = layer.getLatLng();
          this.longitud = coordenadas.lng;
          this.latitud = coordenadas.lat;
        }
        // No es necesario agregar la capa al featureGroup nuevamente, ya que ya está allí debido a la edición.
      });
    });
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
  get operationIdField() {
    return this.form.get('operationId')
  }
  get isOperationIdFieldValid() {
    return this.operationIdField.touched && this.operationIdField.valid;
  }
  get isOperationIdFieldInvalid() {
    return this.operationIdField.touched && this.operationIdField.invalid;
  }
}

