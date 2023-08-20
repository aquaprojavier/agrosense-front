import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, Layer } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Soil } from 'src/app/core/models/soil.model';
import { Operation } from 'src/app/core/models/operation.models';
import { Polygon } from 'src/app/core/models/polygon.models';
import { OperationDto } from 'src/app/core/models/operationDto.models';

@Component({
  selector: 'app-edit-operation',
  templateUrl: './edit-operation.component.html',
  styleUrls: ['./edit-operation.component.scss']
})
export class EditOperationComponent implements OnInit {

  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: Operation[];
  device: Device;
  polygon: Polygon;
  operation: Operation;
  // opeId: number;
  propId: number;
  operationId: number;
  myMap = null;
  poliGeojson: string;
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;
  latitud: number;
  longitud: number;
  polygons: Polygon[] = [];
  polygonLayers: { [polygonId: number]: Layer } = {};

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
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Operation' }, { label: 'Edit', active: true }];
    // this.activatedRoute.snapshot.params['idProp'];
    // this.activatedRoute.snapshot.params['operationId'];
    // Acceder a los parámetros usando subscribe (para escuchar cambios en la URL)
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.operationId = params['idOpe'];
      // Aquí puedes realizar acciones basadas en los parámetros obtenidos
      this.getData(this.propId);
      // this.getOperation(this.operationId);
      this.buildForm();
    },
      (error) => {
        console.log(error);
      }
    );
  };

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
      name: this.operation.operationName,
      area: this.operation.operationArea,
      // polygons: this.operation.polygons,
      // devices: this.operation.devices
    });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(20)]],
      area: ['', [Validators.required, Validators.min(0), Validators.max(500)]]
    });
  }

  upDateOperation() {
    if (this.form.valid) {
      const operationDto: OperationDto = {
        // operationId: +this.devId,
        operationName: this.form.value.name,
        operationArea: this.form.value.area,
        polygons: this.polygons
      };

      console.log(this.polygons);
      this.operationService.updateOperation(this.operationId, operationDto).subscribe(

        (response: Operation) => {

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
    console.log(operations);
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

    // Dentro del evento draw:edited
    this.myMap.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer((layer: any) => {
        for (const polygonId in this.polygonLayers) {
          if (this.polygonLayers[polygonId] === layer) {
            this.polygons.forEach( poly => {
              console.log("paso 1")
              console.log(poly.polygonId);
              if ( poly.polygonId === parseInt(polygonId)){
                poly.geojson = JSON.stringify(layer.toGeoJSON());
                console.log(poly.geojson);
                // this.polygons.push(poly);
              }
            })
          }
        }
      });
    });
    let operationStyleGrey = { color: "#7B7B7B" };
    operations.forEach(ope => {

      if (ope.operationId == this.operationId) {
        this.operation = ope;
        ope.devices.forEach(dev => {
          marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);
        });
        ope.polygons.forEach(poly => {

          this.poliGeojson = poly.geojson;
          
          // Agregar capas al featureGroup desde un objeto GeoJSON
          geoJSON(JSON.parse(this.poliGeojson), {
            onEachFeature: (feature, layer) => {
              // ID del polígono
              const poligono_id = poly.polygonId;
             
              this.polygonLayers[poligono_id] = layer; // Almacenar el layer en el diccionario  
              console.log(this.polygonLayers[poligono_id]);//layer asociado al id del polygon
              this.drawItems.addLayer(layer);
            }
          }).addTo(this.myMap);
          // poly.geojson = this.poliGeojson
          this.polygons.push(poly);
        });

      } else {
        if (ope.devices && ope.devices.length === 0) {
          //Operacion sin dispositivos          
          ope.polygons.forEach(poly => {
            let poligonDevice = JSON.parse(poly.geojson);
            let poligon = geoJSON(poligonDevice, { style: operationStyleGrey }).addTo(this.myMap);
            poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
          });
        } else {
          ope.devices.forEach(dev => {

            marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);

            let operationStyleGrey = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };
            ope.polygons.forEach(poly => {
              let operationObj = JSON.parse(poly.geojson);
              let operationToGjson = geoJSON(operationObj, { style: operationStyleGrey }).addTo(this.myMap);
              operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`)
            })
          });
        }
      }
    });
    this.initForm();
  };

  get operationNameField() {
    return this.form.get('name');
  }
  get isOperationNameFieldValid() {
    return this.operationNameField.touched && this.operationNameField.valid;
  }
  get isOperationNameFieldInvalid() {
    return this.operationNameField.touched && this.operationNameField.invalid;
  }
  get operationAreaField() {
    return this.form.get('area')
  }
  get isOperationAreaFieldValid() {
    return this.operationAreaField.touched && this.operationAreaField.valid;
  }
  get isOperationAreaFieldInvalid() {
    return this.operationAreaField.touched && this.operationAreaField.invalid;
  }
}
