import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Popup } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DeviceDto } from 'src/app/core/models/deviceDto.models';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Operation } from 'src/app/core/models/operation.models';
import { OperationDto } from 'src/app/core/models/operationDto.models';
import { Polygon } from 'src/app/core/models/polygon.models';

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
  deviceDto: DeviceDto;
  opeId: number;
  propId: number;
  devId: number;
  myMap = null;
  // opeGeojson: string;
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;
  // polygon: Polygon;
  polygons: Polygon[] = [];


  constructor(private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
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
  // =========================================FORM============================================================

  private buildForm() {
    this.form = this.formBuilder.group({
      operationName: ['', [Validators.required, Validators.maxLength(20)]],
      operationArea: ['', [Validators.required, Validators.min(0), Validators.max(500)]],//TODO automatizar
    });
  }

  saveOperation() {
    if (this.form.valid) {
      const operationEdit: OperationDto = {
        operationName: this.form.value.operationName,
        operationArea: this.form.value.operationArea,
        propId : this.propId,
        polygons: this.polygons
      };
      console.log(operationEdit);

      this.operationService.createOperation (operationEdit).subscribe(
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

    this.createPolygon();

    // let operacionStyleGrey = { color: "#7B7B7B" };
    let operationStyleYellow = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };

    operations.forEach(ope => {

        ope.polygons.forEach(poly => {
          let poligonDevice = JSON.parse(poly.geojson);
          let poligon = geoJSON(poligonDevice, { style: operationStyleYellow }).addTo(this.myMap);
          poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        })

      ope.devices.forEach(dev => {

        marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);

        // ope.polygons.forEach(poly => {
        //   let operationObj = JSON.parse(poly.geojson);
        //   let operationToGjson = geoJSON(operationObj, { style: operationStyleYellow }).addTo(this.myMap);
        //   operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        // })

      });
    });
  };

  createPolygon() {
    // Evento 'draw:created' para agregar nuevas capas al featureGroup
    this.myMap.on('draw:created', (e) => {
      const layer = e.layer;
      let opeGeojson = JSON.stringify(layer.toGeoJSON());
      // console.log(opeGeojson);
      const polygon1: Polygon = new Polygon();
      polygon1.geojson = opeGeojson;
      this.drawItems.addLayer(layer);
      this.polygons.push(polygon1);
    });
  }

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
