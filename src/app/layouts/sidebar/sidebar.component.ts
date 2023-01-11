import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input, OnChanges } from '@angular/core';
import MetisMenu from 'metismenujs/dist/metismenujs';
import { EventService } from '../../core/services/event.service';
import { LoginService } from '../../core/services/login.service';
import { UserProfileService } from 'src/app/core/services/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { PropertyService } from 'src/app/core/services/property.service';

import { HttpClient } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { User } from '../../core/models/auth.models';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

/**
 * Sidebar component
 */
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('componentRef') scrollRef;
  @Input() isCondensed = false;
  menu: any;
  data: any;
  objUser: any;
  user: User;
  props: any;
  var: any;
  devices: any;

  menuItems = [];

  @ViewChild('sideMenu') sideMenu: ElementRef;

  constructor(
      private propertyService: PropertyService,
      private userService: UserProfileService,
      private loginService: LoginService,
      private eventService: EventService, 
      private router: Router, 
      public translate: TranslateService, 
      private http: HttpClient) {router.events.forEach((event) => {
        if (event instanceof NavigationEnd) {
          // this._activateMenuDropdown();
          this._scrollElement();
          }
        });
      }

  ngOnInit() {
    this._scrollElement();
    this.user = this.loginService.getUser()
    this.props= this.user.propiedades;
    // console.log(this.props);
    let propId
                this.user.propiedades.forEach(element => {
                  if (element.propDefault === 1){
                    propId = element.propId
                  }
                }); 
    this.propertyService.getDevicesByPropertyId(propId).subscribe((data)=> {
      this.devices = data;
      // console.log(this.devices);
    });
    // this.userService.getProperties(this.user.id).subscribe((data)=> {console.log(data)})
  }

  ngAfterViewInit() {
    this.menu = new MetisMenu(this.sideMenu.nativeElement);
    // console.log(this.devices)
    // this._activateMenuDropdown();
  }

  toggleMenu(event) {
    event.currentTarget.nextElementSibling.classList.toggle('mm-show');
  }

  ngOnChanges() {
    if (!this.isCondensed && this.sideMenu || this.isCondensed) {
      setTimeout(() => {
        this.menu = new MetisMenu(this.sideMenu.nativeElement);
      });
    } else if (this.menu) {
      this.menu.dispose();
    }
  }

  // changeData(dev.devicesId){
    
  // }

  changeDevices(idProp:any){
    this.propertyService.getDevicesByPropertyId(idProp).subscribe((data)=> {
      this.devices = data; });
  }

  _scrollElement() {
    setTimeout(() => {
      if (document.getElementsByClassName("mm-active").length > 0) {
        const currentPosition = document.getElementsByClassName("mm-active")[0]['offsetTop'];
        if (currentPosition > 500)
        if(this.scrollRef.SimpleBar !== null)
          this.scrollRef.SimpleBar.getScrollElement().scrollTop =
            currentPosition + 300;
      }
    }, 300);
  }

  /**
   * remove active and mm-active class
   */
  // _removeAllClass(className) {
  //   const els = document.getElementsByClassName(className);
  //   while (els[0]) {
  //     els[0].classList.remove(className);
  //   }
  // }

  // /**
  //  * Activate the parent dropdown
  //  */
  // _activateMenuDropdown() {
  //   this._removeAllClass('mm-active');
  //   this._removeAllClass('mm-show');
  //   const links = document.getElementsByClassName('side-nav-link-ref');
  //   let menuItemEl = null;
  //   // tslint:disable-next-line: prefer-for-of
  //   const paths = [];
  //   for (let i = 0; i < links.length; i++) {
  //     paths.push(links[i]['pathname']);
  //   }
  //   var itemIndex = paths.indexOf(window.location.pathname);
    
  //   if (itemIndex === -1) {
  //     const strIndex = window.location.pathname.lastIndexOf('/');
  //     const item = window.location.pathname.substr(0, strIndex).toString();
  //     menuItemEl = links[paths.indexOf(item)];
  //   } else {
  //     menuItemEl = links[itemIndex];
  //   }
  //   if (menuItemEl) {
  //     menuItemEl.classList.add('active');
  //     const parentEl = menuItemEl.parentElement;
  //     if (parentEl) {
  //       parentEl.classList.add('mm-active');
  //       const parent2El = parentEl.parentElement.closest('ul');
  //       if (parent2El && parent2El.id !== 'side-menu') {
  //         parent2El.classList.add('mm-show');
  //         const parent3El = parent2El.parentElement;
  //         if (parent3El && parent3El.id !== 'side-menu') {
  //           parent3El.classList.add('mm-active');
  //           const childAnchor = parent3El.querySelector('.has-arrow');
  //           const childDropdown = parent3El.querySelector('.has-dropdown');
  //           if (childAnchor) { childAnchor.classList.add('mm-active'); }
  //           if (childDropdown) { childDropdown.classList.add('mm-active'); }
  //           const parent4El = parent3El.parentElement;
  //           if (parent4El && parent4El.id !== 'side-menu') {
  //             parent4El.classList.add('mm-show');
  //             const parent5El = parent4El.parentElement;
  //             if (parent5El && parent5El.id !== 'side-menu') {
  //               parent5El.classList.add('mm-active');
  //               const childanchor = parent5El.querySelector('.is-parent');
  //               if (childanchor && parent5El.id !== 'side-menu') { childanchor.classList.add('mm-active'); }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }

  // }

}
