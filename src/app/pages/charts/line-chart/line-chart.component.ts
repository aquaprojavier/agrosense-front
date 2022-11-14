import { Component, Inject, NgZone, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { DataService } from 'src/app/core/services/data.service';
import { UserProfileService } from 'src/app/core/services/user.service'
import { ActivatedRoute, Params } from '@angular/router';


import { Data } from '../../../core/models/data.models';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import { any } from '@amcharts/amcharts5/.internal/core/util/Array';


@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit{
  
  private root!: am5.Root;
  datas: Data [] = [];
  deviceId: number = 1;
 
  constructor(@Inject(PLATFORM_ID) 
              private platformId: Object, 
              private activatedRoute: ActivatedRoute,
              private zone: NgZone, 
              private dataService: DataService) { }
  
  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.deviceId = params['id'];
      //request data from service
      this.getData(this.deviceId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  // Run the function only in the browser
  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  getData(id:number){
    this.dataService.dataGraf(id).subscribe(datos => {
      this.createMap(datos, "linechartdiv")
    });
  }

  maybeDisposeRoot(divId) {
    am5.array.each(am5.registry.rootElements, function(root) {
      if (root.dom.id == divId) {
        root.dispose();
      }
    });
  }

  createMap(apiData: Data[], divId){
     // Chart code goes in here
     this.browserOnly(() => {

      // Dispose previously created Root element
      this.maybeDisposeRoot(divId);
      /* Chart code */
      // Create root element
      // https://www.amcharts.com/docs/v5/getting-started/#Root_element
      let root = am5.Root.new(divId);
      // Set themes
      // https://www.amcharts.com/docs/v5/concepts/themes/
      root.setThemes([
        am5themes_Animated.new(root)
      ]);

      // Create chart
      // https://www.amcharts.com/docs/v5/charts/xy-chart/
      let chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
      }));

      // Add cursor
      // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
      let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "none"
      }));
      cursor.lineY.set("visible", false);

      function dataLoaded(result) {
        // Set data on all series of the chart
          series.data.processor = am5.DataProcessor.new(root, {
            numericFields: ["dataHum1"],
            dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm:ss"
          });
          series.data.setAll(result);
      }
      // Create axes
      // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
      let xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: 0.2,
        baseInterval: {
          timeUnit: "minute",
          count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      }));

      let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      // Add series
      // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
      let series = chart.series.push(am5xy.LineSeries.new(root, {
        name: "Series",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "dataHum1",
        valueXField: "dataFecha",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY}"
        })
      }));

      // Add scrollbar
      // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
      chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
      }));

      // Make stuff animate on load
      // https://www.amcharts.com/docs/v5/concepts/animations/
      series.appear(1000);
      chart.appear(1000, 100);

      dataLoaded(apiData);
    });
  }

  ngOnDestroy() {
    // Clean up chart when the component is removed
    this.browserOnly(() => {
      if (this.root) {
        this.root.dispose();
      }
    });
  }

}