import { Component, OnInit } from '@angular/core';
import { Map, marker, tileLayer } from 'leaflet';

@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss']
})
export class LeafletComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>;

  constructor() { }

  ngAfterViewInit(): void {
    const map = new Map('map').setView([-33.046659, -68.064864], 15);
    tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }).addTo(map);

    marker([-33.052306, -68.064864]).addTo(map).bindPopup("hola");
    marker([-33.044608, -68.063095]).addTo(map);
  }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Maps' }, { label: 'Leaflet Maps', active: true }];
  }

}
