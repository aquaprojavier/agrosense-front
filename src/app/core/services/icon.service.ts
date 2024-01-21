import { Injectable } from '@angular/core';
import { Icon, ExtraMarkers } from 'leaflet';
import 'leaflet-extra-markers';

@Injectable({
  providedIn: 'root'
})
export class IconService {

  getGaugeIcon(): Icon {
    return new Icon({
      iconUrl: 'assets/images/water-meter.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -16]
    });
  }

  getRedIcon(): Icon {
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  getYellowIcon(): Icon {
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  getGreenIcon(): Icon {
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  getBlueIcon(): Icon {
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  getGreyIcon(): Icon {
    return new Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  getSimpleTempIcon(): Icon {
    return ExtraMarkers.icon({
      shape: 'square',
      markerColor: 'white',
      prefix: '',
      icon: 'fa-number',
      iconColor: '#2e222c',
      iconRotate: 0,
      extraClasses: '',
      number: 'T',
      svg: true
    });
  }

}
