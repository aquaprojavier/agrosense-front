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
import { Polygon } from 'src/app/core/models/polygon.models';
import { Crop } from '../../../core/models/crop.models';
import { Irrigation } from 'src/app/core/models/irrigation.models'; 
import { Soil } from 'src/app/core/models/soil.model';
import { Property } from 'src/app/core/models/property.models';

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
  form: FormGroup;
  drawItems: FeatureGroup;
  geojsonLayer: any;
  polygons: Polygon[] = [];
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
  cropTypeOptions: string[] = ['Almendro','Ajo','Cerezo','Ciruela','Damazco','Durazno','Nogal','Olivo','Peral','Pistacho','Uva de mesa', 'Vid vinífera','Zanahoria', 'Zapallo'];
  riegoOptions: string[] = ['goteo', 'aspersión', 'microaspersión', 'surco'];
  wetSoilOptions: number[] = [100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,15,10,5];
  stoneOptions: number[] = [90,80,70,60,50,40,20,10,5,0];
  rowNumbersOptions: number[] = [1,2,3,4];
  efficiencyOptions: number[] = [95,90,85,80,70,60,50,40,30];
  efficiencyMap: { [key: string]: number } = {
    goteo: 90,
    aspersión: 95,
    microaspersión: 85,
    surco: 30
  };


  constructor(private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private router: Router,) {}

  ngOnInit(): void {
    this.buildForm();
    this.getPlantingYears();
    this.form.get('type').valueChanges.subscribe((selectedType: string) => {
      const efficiencyValue = this.efficiencyMap[selectedType];
      if (efficiencyValue !== undefined) {
        this.form.get('efficiency').setValue(efficiencyValue);
      } else {
        this.form.get('efficiency').reset();
      }
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
    
    this.breadCrumbItems = [{ label: 'Operation' }, { label: 'Create', active: true }];
    this.activatedRoute.snapshot.params['idProp'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.propId = params['idProp'];
      this.getData(this.propId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

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
      rootDepth: ['', [Validators.required]], // Agregar campo 'root' con validación requerida
      stone: [0, [Validators.required]], // Agregar campo 'cc' con validación requerida
      cc: ['', [Validators.required]], // Agregar campo 'cc' con validación requerida
      ur: [50, [Validators.required]], // Agregar campo 'ur' con validación requerida
      pmp: ['', [Validators.required]], // Agregar campo 'pmp' con validación requerida
    });
  }

  saveOperation() {
    if (this.form.valid) {
      // Obtener valores del formulario
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
    const root = this.form.value.rootDepth;
    const stone = this.form.value.stone;
    const cc = this.form.value.cc;
    const ur = this.form.value.ur;
    const pmp = this.form.value.pmp; 

    // Crear objeto Irrigation
    const irrigation: Irrigation = {
      type: irriType,
      efficiency: efficiency,
      betweenEmitters: betweenEmitters,
      rowNumbers: rowNumbers,
      emitterFlow: emitterFlow,
      wetSoil: wetSoil,
    };

    // Crear objeto Crop
    const crop: Crop = {
      cropName: cropName,
    };

    //Crear objrto soil
    const soil: Soil = {
    soilType: soilType,
    depth: root,
    stone: stone,
    cc: cc,
    ur: ur,
    pmp: pmp,
    };
      
    // Crear objeto Operation
    const operationCreated: Operation = {
      propertyId: this.propId, 
      operationName: operationName,
      plantingYear: plantingYear,
      betweenPlant: betweenPlant,
      betweenRow: betweenRow,
      crop: crop,
      polygons: this.polygons,     
      irrigation: irrigation,      
      soil: soil
    };

    //asigna un nombre a cada poligono   
       for (let i = 0; i < this.polygons.length; i++) {
        const polygonName = `${this.form.value.operationName}${i + 1}`;
          this.polygons[i].name = polygonName;
      }
      
      console.log(operationCreated);

      this.operationService.createOperation(operationCreated).subscribe(
        (response: Operation) => {

          console.log('Se ha creado la operacion exitosamente:', response);

          Swal.fire('Creación exitosa!', `La operation <strong>${this.form.value.operationName}</strong> fue creado correctamente.\n
          Área de operación: ${response.operationArea} ha.`, 'success')
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
  showMap(property: Property, operations: Operation[]) {

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
    console.log(this.polygons)

    // let operacionStyleGrey = { color: "#7B7B7B" };
    let operationStyleYellow = { color: "#e8e81c", weight: 1.5, opacity: 1, fillOpacity: 0.0 };

    operations.forEach(ope => {

      ope.polygons.forEach(poly => {
        let poligonDevice = JSON.parse(poly.geojson);
        let poligon = geoJSON(poligonDevice, { style: operationStyleYellow }).addTo(this.myMap);
        poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        poly.devices.forEach(dev => {
          marker(dev.coordenadas, { icon: this.greyIcon }).addTo(this.myMap);
        });
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
      console.log(polygon1);
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
    return this.betweenEmittersField. touched && this.betweenEmittersField.invalid;
  }
  get plantingYearField() {
    return this.form.get('plantingYear');
  }
  get isPlantingYearFieldValid() {
    return this.betweenEmittersField.touched && this.betweenEmittersField.valid;
  }
  get isPlantingYearFieldInvalid() {
    return this.betweenEmittersField. touched && this.betweenEmittersField.invalid;
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
