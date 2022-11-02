import { Component, OnInit } from '@angular/core';
import { geoJSON, LatLng, LatLngExpression, Map, marker, tileLayer } from 'leaflet';
import { UserProfileService } from 'src/app/core/services/user.service';
import { LoginService } from 'src/app/core/services/login.service';
import { PropertyService } from 'src/app/core/services/property.service';
import { User } from '../../../core/models/auth.models';



@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss']
})
export class LeafletComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>;
  coordProperty: [number, number];
  poligono: string;
  user: User;
  algo:any;
  devices: any;
  algo2:any;
  propId:number;

  constructor(
    private propertyService: PropertyService,
    private userService: UserProfileService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Maps' }, { label: 'Leaflet Maps', active: true }];
    this.user = this.loginService.getUser();
    this.algo = Object.values(this.user.propiedades) ;
    this.algo.forEach(element => {
      if (element.propDefault === 1){
        this.coordProperty = element.coordenadas;
        this.poligono = element.geojson;
        this.propId = element.propId
      }
    });   
  }

  ngAfterViewInit(): void {
    
    const map = new Map('map').setView(this.coordProperty, 15);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);
  

    let poli = JSON.parse(this.poligono);
    let poligonoStyle = {color: "#e8e81c",weight:2.5, opacity:1,fillOpacity: 0.0};

    geoJSON(poli, {style : poligonoStyle}).addTo(map);

    map.scrollWheelZoom.disable();
    map.on('focus', () => { map.scrollWheelZoom.enable(); });
    map.on('blur', () => { map.scrollWheelZoom.disable(); });

    this.devices = this.propertyService.getDevicesByPropertyId(this.propId).subscribe((data:any)=> {
      this.algo2 = Object.values(data);
      console.log (this.algo2);
      this.algo2.forEach(element => {
        marker(element.coordenadas).addTo(map);
      }); 
    });
  
   
    

    // this.devices = this.propertyService.getDevicesByPropertyId(1).subscribe((data)=>marker([data[0].latitud, data[0].longitud]).addTo(map).bindPopup("hola"));
    // marker(this.latlong).addTo(map).bindPopup("hola");
    // marker([-33.044608, -68.063095]).addTo(map);
  }

}
