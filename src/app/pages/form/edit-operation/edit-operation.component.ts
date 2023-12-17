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
import { Irrigation } from 'src/app/core/models/irrigation.models';
import { Crop } from 'src/app/core/models/crop.models';

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

  soilTypeOptions: string[] = [
    "Arenoso",
    "Franco-arenoso",
    "Franco",
    "Franco-arcilloso",
    "Arcillo-limoso",
    "Arcilloso",
    // Agrega más tipos de suelo según tus necesidades
  ];
  plantingYearOptions: number[] = []; // Inicializa el array como vacío
  cropTypeOptions: string[] = ['Almendro', 'Ajo', 'Cerezo', 'Ciruela', 'Damazco', 'Durazno', 'Nogal', 'Olivo', 'Peral', 'Pistacho', 'Uva de mesa', 'Vid vinífera', 'Zanahoria', 'Zapallo'];
  riegoOptions: string[] = ['goteo', 'aspersión', 'microaspersión', 'surco'];
  wetSoilOptions: number[] = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
  stoneOptions: number[] = [90, 80, 70, 60, 50, 40, 20, 10, 5, 0];
  rowNumbersOptions: number[] = [1, 2, 3, 4];
  efficiencyOptions: number[] = [95, 90, 85, 80, 70, 60, 50, 40, 30];
  efficiencyMap: { [key: string]: number } = {
    goteo: 90,
    aspersión: 95,
    microaspersión: 85,
    surco: 30
  };

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
    this.getPlantingYears();
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

  getPlantingYears(){
    const currentYear: number = new Date().getFullYear(); // Obtiene el año actual
    const startYear: number = 1960; // Año inicial deseado
    const endYear: number = 2023; // Año final deseado

    for (let year = endYear; year >= startYear; year--) {
      this.plantingYearOptions.push(year);
    }
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
      operationName: this.operation.operationName,
      crop: this.operation.crop.cropName,
      betweenPlant: this.operation.betweenPlant,
      betweenRow: this.operation.betweenRow,
      plantingYear: this.operation.plantingYear,

      type: this.operation.irrigation.type,
      efficiency: this.operation.irrigation.efficiency,
      betweenEmitters: this.operation.irrigation.betweenEmitters,
      rowNumbers: this.operation.irrigation.rowNumbers,
      emitterFlow: this.operation.irrigation.emitterFlow,
      wetSoil: this.operation.irrigation.wetSoil,

      soilType: this.operation.soil.soilType,
      depth: this.operation.soil.depth,
      stone: this.operation.soil.stone,
      cc: this.operation.soil.cc,
      ur: this.operation.soil.ur,
      pmp: this.operation.soil.pmp,
    });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      operationName: ['', [Validators.required, Validators.maxLength(20)]],
      crop: ['', [Validators.required, Validators.maxLength(20)]],
      betweenPlant: ['', [Validators.required, Validators.min(0.15), Validators.max(15)]],
      betweenRow: ['', [Validators.required, Validators.min(0.3), Validators.max(15)]],
      plantingYear: ['', [Validators.required, Validators.min(1950), Validators.max(2023)]],

      type: ['', [Validators.required]], // Agregar campo 'type' con validación requerida
      efficiency: ['', [Validators.required, Validators.min(30), Validators.max(95)]],
      betweenEmitters: ['', [Validators.required, Validators.min(0.15), Validators.max(3)]],
      rowNumbers: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
      emitterFlow: ['', [Validators.required, Validators.min(0.5), Validators.max(8)]],
      wetSoil: ['', [Validators.required, Validators.min(5), Validators.max(100)]],

      soilType: ['', [Validators.required]], // Agregar campo 'soilType' con validación requerida
      depth: ['', [Validators.required]], // Agregar campo 'root' con validación requerida
      stone: [0, [Validators.required]], // Agregar campo 'cc' con validación requerida
      cc: ['', [Validators.required]], // Agregar campo 'cc' con validación requerida
      ur: [50, [Validators.required]], // Agregar campo 'ur' con validación requerida
      pmp: ['', [Validators.required]], // Agregar campo 'pmp' con validación requerida
    });
  }


  upDateOperation() {
    if (this.form.valid) {

      const operationName = this.form.value.operationName;
      const betweenPlant = this.form.value.betweenPlant;
      const betweenRow = this.form.value.betweenRow;
      const plantingYear = this.form.value.plantingYear;

      const cropName = this.form.value.crop;

      const irriType = this.form.value.type;
      const efficiency = this.form.value.efficiency;
      const betweenEmitters = this.form.value.betweenEmitters;
      const rowNumbers = this.form.value.rowNumbers;
      const emitterFlow = this.form.value.emitterFlow;
      const wetSoil = this.form.value.wetSoil;

      const soilType = this.form.value.soilType;
      const depth = this.form.value.depth;
      const stone = this.form.value.stone;
      const cc = this.form.value.cc;
      const ur = this.form.value.ur;
      const pmp = this.form.value.pmp;

      // Crear objeto Irrigation
      const irrigation: Irrigation = {
        irrigationId: this.operation.irrigation.irrigationId,
        type: irriType,
        efficiency: efficiency,
        betweenEmitters: betweenEmitters,
        rowNumbers: rowNumbers,
        emitterFlow: emitterFlow,
        wetSoil: wetSoil,
      };

      // Crear objeto Crop
      const crop: Crop = {
        cropId: this.operation.crop.cropId,
        cropName: cropName,
      };

      //Crear objrto soil
      const soil: Soil = {
        id: this.operation.soil.id,
        soilType: soilType,
        depth: depth,
        stone: stone,
        cc: cc,
        ur: ur,
        pmp: pmp,
      };
      const operationEdited: Operation = {
        // operationId: +this.devId,
        polygons: this.polygons,
        propertyId: this.propId,
        operationName: operationName,
        plantingYear: plantingYear,
        betweenPlant: betweenPlant,
        betweenRow: betweenRow,
        crop: crop,
        irrigation: irrigation,
        soil: soil
      };

      console.log(this.polygons);
      this.operationService.updateOperation(this.operationId, operationEdited).subscribe(

        (response: Operation) => {

          console.log('Se ha guardado el formulario exitosamente:', response);

          Swal.fire('Edición exitosa!', `El dispositivo ${this.form.value.operationName} se actualizó correctamente`, 'success')
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
            // Encuentra el polígono correspondiente al id
            this.polygons.forEach(poly => {
              
              if (poly.polygonId === parseInt(polygonId)) {
                // Actualiza el GeoJSON del polígono
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
        console.log(ope)
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
    return this.form.get('operationName');
  }
  get isOperationNameFieldValid() {
    return this.operationNameField.touched && this.operationNameField.valid;
  }
  get isOperationNameFieldInvalid() {
    return this.operationNameField.touched && this.operationNameField.invalid;
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
  get typeField() {
    return this.form.get('type');
  }
  get isTypeFieldValid() {
    return this.typeField.touched && this.typeField.valid;
  }
  get isTypeFieldInvalid() {
    return this.typeField.touched && this.typeField.invalid;
  }
  get cropField() {
    return this.form.get('crop');
  }
  get isCropFieldValid() {
    return this.cropField.touched && this.cropField.valid;
  }
  get isCropFieldInvalid() {
    return this.cropField.touched && this.cropField.invalid;
  }
  get betweenPlantField() {
    return this.form.get('betweenPlant');
  }
  get isBetweenPlantFieldValid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.valid;
  }
  get isBetweenPlantFieldInvalid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.invalid;
  }
  get plantingYearField() {
    return this.form.get('plantingYear');
  }
  get isPlantingYearFieldValid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.valid;
  }
  get isPlantingYearFieldInvalid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.invalid;
  }
  get efficiencyField() {
    return this.form.get('efficiency');
  }
  get isEfficiencyFieldValid() {
    return this.efficiencyField.touched && this.efficiencyField.valid;
  }
  get isEfficiencyFieldInvalid() {
    return this.efficiencyField.touched && this.efficiencyField.invalid;
  }
  get betweenEmittersField() {
    return this.form.get('betweenEmitters');
  }
  get isBetweenEmittersFieldValid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.valid;
  }
  get isBetweenEmittersFieldInvalid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.invalid;
  }
  get rowNumbersField() {
    return this.form.get('rowNumbers');
  }
  get isRowNumbersFieldValid() {
    return this.rowNumbersField.touched && this.rowNumbersField.valid;
  }
  get isRowNumbersFieldInvalid() {
    return this.rowNumbersField.touched && this.rowNumbersField.invalid;
  }
  get betweenRowField() {
    return this.form.get('betweenRow');
  }
  get isBetweenRowFieldValid() {
    return this.betweenRowField.touched && this.betweenRowField.valid;
  }
  get isBetweenRowFieldInvalid() {
    return this.betweenRowField.touched && this.betweenRowField.invalid;
  }
  get emitterFlowField() {
    return this.form.get('emitterFlow');
  }
  get isEmitterFlowFieldValid() {
    return this.emitterFlowField.touched && this.emitterFlowField.valid;
  }
  get isEmitterFlowFieldInvalid() {
    return this.emitterFlowField.touched && this.emitterFlowField.invalid;
  }
  get wetSoilField() {
    return this.form.get('wetSoil');
  }
  get isWetSoilFieldValid() {
    return this.wetSoilField.touched && this.wetSoilField.valid;
  }
  get isWetSoilFieldInvalid() {
    return this.wetSoilField.touched && this.wetSoilField.invalid;
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
  get depthField() {
    return this.form.get('depth');
  }
  get isDepthFieldValid() {
    return this.depthField.touched && this.depthField.valid;
  }
  get isDepthFieldInvalid() {
    return this.depthField.touched && this.depthField.invalid;
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
