import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { geoJSON, Icon, Map, marker, tileLayer, FeatureGroup, Control, layerGroup } from 'leaflet';
import 'leaflet-draw';
import { PropertyService } from 'src/app/core/services/property.service';
import { OperationService } from 'src/app/core/services/operation.service';
import { DeviceDto } from 'src/app/core/models/deviceDto.models';
import { DeviceService } from 'src/app/core/services/device.service';
import { DataService } from 'src/app/core/services/data.service';
import { User } from 'src/app/core/models/auth.models';
import { ActivatedRoute, Params } from '@angular/router';
import { Device } from '../../../core/models/device.models';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Operation } from 'src/app/core/models/operation.models';
import { Soil } from '../../../core/models/soil.model';
import { IconService } from 'src/app/core/services/icon.service';
import { Property } from 'src/app/core/models/property.models';
import { Polygon } from 'src/app/core/models/polygon.models';
import * as turf from '@turf/turf';
import { combineLatest } from 'rxjs';


@Component({
  selector: 'app-create-device',
  templateUrl: './create-device.component.html',
  styleUrls: ['./create-device.component.scss']
})
export class CreateDeviceComponent implements OnInit {
  iconoGral: Icon;
  gaugeIcon: Icon;
  redIcon: Icon;
  greenIcon: Icon;
  blueIcon: Icon;
  greyIcon: Icon;
  tempIcon: Icon;
  selectedType: string;
  breadCrumbItems: Array<{}>;
  user: User;
  property: any;
  operations: Operation[];
  device: Device;
  deviceDto: DeviceDto;
  opeId: number;
  polyId: number;
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
  polygons: Polygon[] = [];
  devicesList = ['Suelo', 'Temp.', 'Caudal']; // Lista de tipos de dispositivos
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

  constructor(
    private formBuilder: FormBuilder,
    private iconService: IconService,
    private activatedRoute: ActivatedRoute,
    private propertyService: PropertyService,
    private operationService: OperationService,
    private deviceService: DeviceService,
    private dataService: DataService,
    private router: Router,) { }

  ngOnInit(): void {

    this.breadCrumbItems = [{ label: 'Device' }, { label: 'Create', active: true }];
    this.getIcons();
    this.iconoGral = this.blueIcon;
    this.activatedRoute.snapshot.params['idProp'];
    this.getFreeSerialNumber("draginonestor");
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

  getIcons() {
    this.gaugeIcon = this.iconService.getGaugeIcon();
    this.redIcon = this.iconService.getRedIcon();
    this.greenIcon = this.iconService.getGreenIcon();
    this.blueIcon = this.iconService.getBlueIcon();
    this.greyIcon = this.iconService.getGreyIcon();
    this.tempIcon = this.iconService.getSimpleTempIcon();
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
      latitud: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/), Validators.min(-90), Validators.max(90)]],
      longitud: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/), Validators.min(-180), Validators.max(180)]],
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

    combineLatest([
      this.form.get('latitud').valueChanges,
      this.form.get('longitud').valueChanges
    ]).subscribe(([latitud, longitud]) => {
      // Verificar si ambas latitud y longitud son válidas antes de actualizar el marcador
      if (latitud !== null && longitud !== null) {
        this.actualizarMarcadorDesdeFormulario();
      }
    });
    // Controlamos los cambios en devicesTipo para mostrar u ocultar los campos adicionales
    this.form.get('devicesTipo').valueChanges.subscribe((selectedType: string) => {
      //la siguiente era una logica para al crear un device se cree con el icono correspondiente, no funciono bien
      switch (selectedType) {
        case "Soil":
          this.iconoGral = this.greyIcon
          break;
        case "Temp.":
          this.iconoGral = this.tempIcon
          break;
        case "Caudal":
          this.iconoGral = this.gaugeIcon
          break;
        default:
          this.iconoGral = this.greyIcon
      };
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
  };

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
      const polygonId = this.polyId;
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
        polygonId: polygonId,
        devicesCultivo: devicesCultivo,
        operationId: operationId,
        soil: soil
      };

      console.log(deviceDto);
      this.deviceService.createDevice({ data: deviceDto }).subscribe(
        (response: Device) => {

          console.log('Se ha creado el dispositivo exitosamente:', response);

          Swal.fire({
            title: 'Creación exitosa!',
            html: `El dispositivo <strong>${deviceDto.devicesNombre}</strong> fue creado correctamente`,
            icon: 'success'
          }).then(() => {
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

  // Actualiza los valores del formulario con las nuevas coordenadas
  actualizarCoordenadas(latitud: number, longitud: number) {
    this.form.patchValue({
      latitud: latitud,
      longitud: longitud,
    });
    // Llamada al método para actualizar el marcador desde el formulario
    // this.actualizarMarcadorDesdeFormulario();
  }
  // Actualiza los valores desde el formulario hacia el mapa
  actualizarMarcadorDesdeFormulario() {

    const latitud = this.form.get('latitud').value;
    const longitud = this.form.get('longitud').value;
    const selectedType: string = this.form.get('devicesTipo').value;

    // Elimina el marcador existente solo si hay algo en el featureGroup
    if (this.drawItems.getLayers().length > 0) {
      this.drawItems.clearLayers();
    }
    // Crea un nuevo marcador en la posición actualizada
    const nuevoMarcador = marker([latitud, longitud], { icon: this.iconoGral });
    nuevoMarcador.addTo(this.myMap);
    this.drawItems.addLayer(nuevoMarcador);

    // Centra el mapa en la nueva posición
    this.myMap.setView([latitud, longitud], 15);

    // Verificar si el tipo seleccionado es 'Suelo' para realizar la lógica del polígono
    if (selectedType === 'Suelo') {

      // Verificar si el marcador está dentro de algún polígono
      const punto = turf.point([longitud, latitud]); // Cambia el orden si es necesario

      this.operations.forEach((operation) => {
        operation.polygons.forEach((polygon) => {
          try {
            const geojsonObject = JSON.parse(polygon.geojson);
            if (turf.booleanPointInPolygon(punto, geojsonObject)) {
              this.polyId = polygon.polygonId;
              this.opeId = operation.operationId;

              // Supongamos que has detectado polygonId y operationId al agregar el marcador
              const polygonIdDetectado = this.polyId;
              const operationIdDetectado = this.opeId;

              // Buscar la operación correspondiente al operationId detectado
              const operationCorrespondiente = this.operations.find(ope => ope.operationId === operationIdDetectado);

              // Verificar si se encontró la operación
              if (operationCorrespondiente) {
                // Establecer el valor del formControl 'opeId' con el operationId detectado
                this.form.get('opeId').patchValue(operationCorrespondiente.operationId);
              }
            }
          } catch (error) {
            console.error('Error al parsear el GeoJSON:', error);
          }
        });
      });
    }
  };

  showMap(property: Property, operations: Operation[]) {
    const selectedType = this.form.get('devicesTipo').value;

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
    let propertyStyle = { color: "#1ce5e8", weight: 2, opacity: 1, fillOpacity: 0.0 };
    let propertyToGjson = geoJSON(propertyObj, { style: propertyStyle }).addTo(this.myMap);
    this.myMap.fitBounds(propertyToGjson.getBounds());

    this.myMap.scrollWheelZoom.disable();
    this.myMap.on('focus', () => { this.myMap.scrollWheelZoom.enable(); });
    this.myMap.on('blur', () => { this.myMap.scrollWheelZoom.disable(); });

    let operationStyleblack = { color: "#0f0f0f", weight: 1.5, opacity: 1, fillOpacity: 0.05 };
    let operationStyleYellow = { color: "#e1e858", weight: 1.5, opacity: 1, fillOpacity: 0.05 };

    // Function to add markers
    const addMarker = (dev: Device, icon: Icon) => {
      const formattedLatitud = dev.latitud.toFixed(3);
      const formattedLongitud = dev.longitud.toFixed(3);
      marker(dev.coordenadas, { icon }).addTo(this.myMap).bindPopup(
        `
            <div class="container text-center" style="width: 130px; line-height: 0.5; margin-left: 0px; margin-right: 0px; padding-right: 0px; padding-left: 0px;">
      
                <div class="row">
                  <div class="col-12">
                    <div>
                      <h5 style="color: black; margin-bottom: 0px;">Dispositivo: <b>${dev.devicesNombre}</b></h5>
                    </div>
                  </div>
                </div>
  
                <div class="row">
                  <div class="col-12">
                    <h2 style="color: black; margin-bottom: 0px;">
                     ${dev.devicesType}
                    </h2>
                  </div>
                </div>
      
                <div class="row">
                  <div class="col-12" style="margin-bottom: 10px;">
                    <img src="${getDeviceTypeImage(dev.devicesType)}" alt="">
                  </div>
                </div>
      
                <div class="row">
                  <div class="col-6">
                    <h5 style="color: black; margin-bottom: 0px;">Latitud:<br><b>${formattedLatitud}</b></h5>
                  </div>
                  <div class="col-6">
                    <h5 style="color: black; margin-bottom: 0px;">Longitud:<br><b>${formattedLongitud}</b></h5>
                  </div>
                </div>
              </div>
              `, { closeButton: false }
      );
    };

    function getDeviceTypeImage(deviceType) {
      switch (deviceType) {
        case 'Suelo':
          return 'assets/images/metering64.png'; // Ruta de imagen para Tipo1
        case 'Temp.':
          return 'assets/images/temperature64.png'; // Ruta de imagen para Tipo2
        case 'Caudal':
          return 'assets/images/water-meter64.png'; // Ruta de imagen para Tipo2
        // Agrega más casos según sea necesario para otros tipos de dispositivos
        default:
          return 'assets/images/smart-farm64.png'; // Ruta de imagen por defecto
      }
    }

    property.devices.forEach(dev => {
      if (dev.devicesType === 'Temp.') {
        addMarker(dev, this.tempIcon);
      } else if (dev.devicesType === 'Caudal') {
        addMarker(dev, this.gaugeIcon);
      }
    });

    operations.forEach(ope => {
      // Verificar si la operación tiene algún polígono con dispositivos
      if (ope.polygons.some(poly => poly.devices && poly.devices.length > 0)) {

        ope.polygons.forEach(poly => {
          this.polygons.push(poly)
          let operationObj = JSON.parse(poly.geojson);
          let operationToGjson = geoJSON(operationObj, { style: operationStyleYellow }).addTo(this.myMap);
          operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
          poly.devices.forEach(dev => {

            addMarker(dev, this.greyIcon)

            let operationObj = JSON.parse(poly.geojson);
            let operationToGjson = geoJSON(operationObj, { style: operationStyleYellow }).addTo(this.myMap);
            operationToGjson.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/grapes.png" alt=""> Variedad: <b>${dev.devicesCultivo}</b><br><br><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
          })
        })
      } else {
        // la operacion no tiene ningun poligono
        ope.polygons.forEach(poly => {
          this.polygons.push(poly)
          let poligonDevice = JSON.parse(poly.geojson);
          let poligon = geoJSON(poligonDevice, { style: operationStyleblack }).addTo(this.myMap);
          poligon.bindPopup(`<div style="line-height: 0.5;"><div style="text-align: center;"><img src="assets/images/location.png" alt=""><br><br>Operacion: <b>${ope.operationName}</b><br><br></div><img src="assets/images/selection.png" alt=""> Superficie: <b>${ope.operationArea} ha.</b><br></Div>`, { closeButton: false })
        })
      }
    });

    // FeatureGroup is to store editable layers
    this.drawItems = new FeatureGroup();

    const drawControl = new Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        polyline: false,
        circlemarker: false,
        polygon: false,
        marker: {
          icon: this.blueIcon
        }
      },
      edit: {
        featureGroup: this.drawItems,
        edit: false,  // Deshabilitar la edición directa
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
        // Elimina el marcador existente
       
        this.drawItems.clearLayers();
       

        let coordenadas = layer.toGeoJSON().geometry.coordinates;
        this.actualizarCoordenadas(coordenadas[1], coordenadas[0]);
        console.log(coordenadas[1]);
        console.log(coordenadas[0]);

        // Verificar si el tipo seleccionado es 'Suelo' para realizar la lógica del polígono
        if (selectedType === 'Suelo') {

          // Verificar si el marcador está dentro de algún polígono
          const punto = turf.point([coordenadas[0], coordenadas[1]]); // Cambia el orden si es necesario
          // Recorre tus polígonos y verifica la intersección

          this.operations.forEach((operation) => {
            operation.polygons.forEach((polygon) => {
              try {
                const geojsonObject = JSON.parse(polygon.geojson);
                if (turf.booleanPointInPolygon(punto, geojsonObject)) {
                  this.polyId = polygon.polygonId;
                  this.opeId = operation.operationId;

                  // Supongamos que has detectado polygonId y operationId al agregar el marcador
                  const polygonIdDetectado = this.polyId;
                  const operationIdDetectado = this.opeId;

                  // Buscar la operación correspondiente al operationId detectado
                  const operationCorrespondiente = this.operations.find(ope => ope.operationId === operationIdDetectado);

                  // Verificar si se encontró la operación
                  if (operationCorrespondiente) {
                    // Establecer el valor del formControl 'opeId' con el operationId detectado
                    this.form.get('opeId').patchValue(operationCorrespondiente.operationId);
                  }
                  // Actualizar el formulario desde el marcador, no funciona, ver !
                  this.form.get('latitud').patchValue(coordenadas[1]);
                  this.form.get('longitud').patchValue(coordenadas[0]);
                }
              } catch (error) {
                console.error('Error al parsear el GeoJSON:', error);
              }
            });
          });
        }
        // this.drawItems.addLayer(layer);
        console.log(this.drawItems.getLayers())
      };


    });
  };

  getDeviceTypeImage(deviceType: string) {
    switch (deviceType) {
      case 'Suelo':
        return 'assets/images/root32px.png'; // Ruta de imagen para Tipo1
      case 'Temp.':
        return 'assets/images/temperature32.png'; // Ruta de imagen para Tipo2
      case 'Caudal':
        return 'assets/images/water-meter32.png'; // Ruta de imagen para Tipo2
      // Agrega más casos según sea necesario para otros tipos de dispositivos
    }
  }


  ngOnDestroy() {
    if (this.myMap) {
      this.myMap.off(); // Desvincula todos los eventos del mapa
      this.myMap.remove();
    }
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
  get psmField() {
    return this.form.get('psm');
  }
  get isPsmFieldValid() {
    return this.psmField.touched && this.psmField.valid;
  }
  get isPsmFieldInvalid() {
    return this.psmField.touched && this.psmField.invalid;
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
