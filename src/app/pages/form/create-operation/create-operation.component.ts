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
import { Operation } from 'src/app/core/models/operation.models';

@Component({
  selector: 'app-create-operation',
  templateUrl: './create-operation.component.html',
  styleUrls: ['./create-operation.component.scss']
})
export class CreateOperationComponent implements OnInit {

  greyIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operation: Operation
  operations: Operation[];
  device: Device;
  deviceEdit: DeviceEdit;
  opeId: number;
  propId: number;
  devId: number;
  myMap = null;
  opeGeojson: string;
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;

  constructor(private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private deviceService: DeviceService,
    private router: Router,) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Operation' }, { label: 'Create', active: true }];
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

  private buildForm() {
    this.form = this.formBuilder.group({
      operationName: ['', [Validators.required, Validators.maxLength(20)]],
      operationArea: ['', [Validators.required, Validators.min(0), Validators.max(500)]],//TODO automatizar
    });
  }

  createOperation() {
    if (this.form.valid) {
      // this.operations.forEach(ope => {
      //   if (this.form.value.opeId == ope.operationId) {
      //     this.opeGeojson = ope.operationGeojson
      //   }
      // })
      const operationEdit: Operation = {
        operationName: this.form.value.operationName,
        operationArea: this.form.value.operationArea,
        operationGeojson: this.opeGeojson
      };

      console.log(operationEdit);

      this.operationService.CreateOperationWithPropId(this.propId, operationEdit).subscribe(
        (response: Operation) => {

          console.log('Se ha creado la operacion exitosamente:', response);

          Swal.fire('Creación exitosa!', `La operation ${this.form.value.operationName} fue creado correctamente`, 'success')
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
  createMap (property, operations) {
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

    //Desactiva el zoom con la rueda del ratón cuando se carga inicialmente el mapa y lo activa cuando el mapa gana el foco, y lo desactiva cuando el mapa pierde el foco.
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
      this.opeGeojson = JSON.stringify(layer.toGeoJSON());
      console.log(this.opeGeojson);
      this.drawItems.addLayer(layer);
    });

    // Evento 'draw:edited' para editar capas del featureGroup
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        this.opeGeojson = JSON.stringify(layer.toGeoJSON());
      });
    });
    //  // Agregar capas al featureGroup desde un objeto GeoJSON
    //  geoJSON(JSON.parse(this.opeGeojson), {
    //   onEachFeature: (feature, layer) => {
    //     this.drawItems.addLayer(layer);
    //   }
    // }).addTo(this.myMap);
    operations.forEach(ope => {

      ope.devices.forEach(dev => {

        marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);

        let operationObj = JSON.parse(ope.operationGeojson);
        let operationStyleGrey = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };
        let operationToGjson = geoJSON(operationObj, { style: operationStyleGrey }).addTo(this.myMap);
        operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)

        // }
      });
    });
  };

  get operationNameField() {
    return this.form.get('operationName');
  }
  get isOperationNameFieldValid() {
    return this.operationNameField.touched && this.operationNameField.valid;
  }
  get isOperationNameFieldInvalid() {
    return this.operationNameField.touched && this.operationNameField.invalid;
  }

  get operationAreaField() {
    return this.form.get('operationArea')
  }
  get isOperationAreaFieldValid() {
    return this.operationAreaField.touched && this.operationAreaField.valid;
  }
  get isOperationAreaFieldInvalid() {
    return this.operationAreaField.touched && this.operationAreaField.invalid;
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

}
