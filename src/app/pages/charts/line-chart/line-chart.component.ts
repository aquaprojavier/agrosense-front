import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { Data } from 'src/app/core/models/data.models';
import { Soil } from 'src/app/core/models/soil.model';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from "@amcharts/amcharts5/stock";
import { DataService } from 'src/app/core/services/data.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { Device } from 'src/app/core/models/device.models';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {

  private root!: am5.Root;
  toolbar: any;
  cc: number;
  pmp: number;
  ur: number;
  datos: Data[] = [];
  deviceId: number = 1;
  soil: Soil;
  selectedDays: number = 30; // Valor predeterminado, puedes ajustarlo según tu lógica
  device: Device


  constructor(@Inject(PLATFORM_ID)
  private platformId: Object,
    private zone: NgZone,
    private activatedRoute: ActivatedRoute,
    private dataService: DataService,
    private deviceService: DeviceService
  ) { }

  ngOnInit(): void {
    this.activatedRoute.snapshot.params['id'];
    this.activatedRoute.params.subscribe((params: Params) => {
      this.deviceId = params['id'];
      this.getData(this.deviceId, 30);
      this.getSoil(this.deviceId);
      this.getDevice(this.deviceId);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  getDevice (id: number){
    this.deviceService.getDevicesById(id).subscribe(dev => {
      this.device = dev;
      console.log(dev)
    })
  }

  getData(id: number, days: number) {
    this.dataService.showDataByIdAndLastDays(id, days).subscribe(data => {
      this.datos = data
      this.createGraph(this.datos, "linechartdiv");
    });
  }

  onButtonClick(days: number) {
    this.selectedDays = days; // Actualizar el valor de días seleccionado
    this.getData(this.deviceId, days); // Llamar a la función getData con el nuevo número de días
  }  

  getSoil(id: number) {
    this.deviceService.getSoilByDevicesId(id).subscribe(data => {
      this.soil = data
      this.cc = this.soil.cc;
      this.pmp = this.soil.pmp;
      this.ur = (this.cc + this.pmp) * 0.5;
    });
  }

  // Run the function only in the browser
  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  maybeDisposeRoot(divId) {
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root && root.dom.id == divId) {
        root.dispose();
      }
    });
  }

  createGraph(apiData: Data[], divId) {
    // Chart code goes in here
    this.browserOnly(() => {

      // Dispose previously created Root element
      this.maybeDisposeRoot(divId);
      // this.maybeDisposeRoot(chartcontrols);

      // Remove content from chart divs
      // let chartcontrolsDiv = document.getElementById(chartcontrols);
      // while (chartcontrolsDiv.firstChild) {
      //   chartcontrolsDiv.removeChild(chartcontrolsDiv.firstChild);
      // }

      let chartDiv = document.getElementById(divId);
      while (chartDiv.firstChild) {
        chartDiv.removeChild(chartDiv.firstChild);
      }
      /* Chart code */
      // Create root element
      // https://www.amcharts.com/docs/v5/getting-started/#Root_element
      let root = am5.Root.new(divId);
      // Set themes
      // https://www.amcharts.com/docs/v5/concepts/themes/
      root.setThemes([
        am5themes_Animated.new(root),
        am5themes_Dark.new(root)//modo dark
      ]);
      // Create a stock chart
      // https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
      let stockChart = root.container.children.push(am5stock.StockChart.new(root, {})
      );

      // Create a main stock panel (chart)
      // https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
      let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
        // wheelY: "zoomX",
        panX: false,
        panY: false,
        pinchZoomX: true,
        layout: root.verticalLayout
      }));

      // Add cursor
      // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
      let cursor = mainPanel.set("cursor", am5xy.XYCursor.new(root, {
        // yAxis: valueAxis,
        // xAxis: dateAxis,
        behavior: "zoomX"
      }));

      cursor.lineY.set("visible", false);

      // Create axes
      // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
      let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      let dateAxis = mainPanel.xAxes.push(am5xy.DateAxis.new(root, {
        baseInterval: {
          timeUnit: "minute",
          count: 10
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      }));

      function dataLoaded(result) {
        // Set data on all series of the chart
        valueSeries.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum1", "cc", "ur"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        // Set the data processor and data for valueSeries2
        valueSeries2.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum2", "cc", "ur"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        // Set the data processor and data for valueSeries3
        valueSeries3.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum", "cc", "ur"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        valueSeries.data.setAll(result);
        valueSeries2.data.setAll(result);
        valueSeries3.data.setAll(result);
        sbSeries.data.setAll(apiData);
      };

      let valueSeries = mainPanel.series.push(am5xy.LineSeries.new(root, {
        name: "Humedad 30cm",
        valueXField: "dataFecha",
        valueYField: "dataHum1",
        stroke: am5.color("#03549c"),
        xAxis: dateAxis,
        yAxis: valueAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY}%",
          keepTargetHover: true
        })
      }));

      let valueSeries2 = mainPanel.series.push(am5xy.LineSeries.new(root, {
        name: "Humedad 60cm",
        valueXField: "dataFecha",
        valueYField: "dataHum2",
        stroke: am5.color("#ff0000"),
        xAxis: dateAxis,
        yAxis: valueAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY}%",
          keepTargetHover: true
        })
      }));

      let valueSeries3 = mainPanel.series.push(am5xy.SmoothedXLineSeries.new(root, {
        name: "Humedad media",
        valueXField: "dataFecha",
        valueYField: "dataHum",
        stroke: am5.color("#02691c"),
        xAxis: dateAxis,
        yAxis: valueAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY}%",
          keepTargetHover: true
        })
      }));

      // ========================= RANGOS ====================================
      // add saturation range
      let saturationRangeDataItem = valueAxis.makeDataItem({ value: 50, endValue: this.cc });
      valueSeries.createAxisRange(saturationRangeDataItem);

      saturationRangeDataItem.get("axisFill").setAll({
        fill: am5.color("#86dbf0"),
        fillOpacity: 1,
        visible: true
      });

      saturationRangeDataItem.get("label").setAll({
        location: 0,
        visible: true,
        text: "WC",
        inside: true,
        centerX: 0,
        centerY: am5.p100,
        fontWeight: "bold",
        fill: am5.color(0xffffff),
        background: am5.RoundedRectangle.new(root, {
          fill: am5.color("#668f64")
        }),
      })

      // add optimo range
      let optimoRangeDataItem = valueAxis.makeDataItem({ value: this.cc, endValue: this.ur });
      let optimoRange = valueSeries.createAxisRange(optimoRangeDataItem);

      optimoRangeDataItem.get("axisFill").setAll({
        fill: am5.color("#98f086"),
        fillOpacity: 1,
        visible: true
      });

      optimoRangeDataItem.get("label").setAll({
        location: 0,
        visible: true,
        text: "WC",
        inside: true,
        centerX: 0,
        centerY: am5.p100,
        fontWeight: "bold",
        fill: am5.color(0xffffff),
        background: am5.RoundedRectangle.new(root, {
          fill: am5.color("#3ead4f")
        }),
      })

      // add caution range
      let cautionRangeDataItem = valueAxis.makeDataItem({ value: this.ur, endValue: this.pmp });
      let cautionRange = valueSeries.createAxisRange(cautionRangeDataItem);

      cautionRangeDataItem.get("axisFill").setAll({
        fill: am5.color("#faf8a2"),
        fillOpacity: 1,
        visible: true
      });

      cautionRangeDataItem.get("label").setAll({
        inside: true,
        fill: am5.color("#11120b"),
        text: "UR",
        background: am5.RoundedRectangle.new(root, {
          fill: am5.color("#cfdb27")
        }),
        location: 0,
        visible: true,
        centerX: 0,
        centerY: am5.p100,
        fontWeight: "bold"
      })

      // add pmp series range
      let pmpRangeDataItem = valueAxis.makeDataItem({ value: this.pmp, endValue: 0 });
      let urRange = valueSeries.createAxisRange(pmpRangeDataItem);

      urRange.strokes.template.set("stroke", am5.color("#f50a45"));

      pmpRangeDataItem.get("grid").setAll({
        strokeOpacity: 1,
        visible: true,
        stroke: am5.color("#fa1e38"),
        strokeDasharray: [5, 5]
      })

      pmpRangeDataItem.get("axisFill").setAll({
        fill: am5.color("#f59ab8"),
        fillOpacity: 1,
        visible: true
      });

      pmpRangeDataItem.get("label").setAll({
        inside: true,
        fill: am5.color(0xffffff),
        text: "PMP",
        background: am5.RoundedRectangle.new(root, {
          fill: am5.color("#f50a45")
        }),
        location: 0,
        visible: true,
        centerX: 0,
        centerY: am5.p100,
        fontWeight: "bold"
      })
      // =========================FIN RANGOS ====================================
      // Add scrollbar
      // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
      let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 30
      }));
      stockChart.toolsContainer.children.push(scrollbar);
      
      let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
        baseInterval: {
          timeUnit: "minute",
          count: 10
        },
        renderer: am5xy.AxisRendererX.new(root, {})
      }));
      
      let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));
      
      let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
        valueYField: "dataHum",
        valueXField: "dataFecha",
        xAxis: sbDateAxis,
        yAxis: sbValueAxis
      }));

      sbSeries.fills.template.setAll({
        visible: true,
        fillOpacity: 0.3
      });
      
     

      // Eliminar el toolbar anterior si existe
      // if (this.toolbar) {
      //   this.toolbar.dispose();
      // }

      // Add toolbar
      // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
      // this.toolbar = am5stock.StockToolbar.new(root, {
      //   container: document.getElementById("chartcontrols"),
      //   stockChart: stockChart,
      //   controls: [
      //     am5stock.DateRangeSelector.new(root, {
      //       stockChart: stockChart
      //     }),
      //     am5stock.PeriodSelector.new(root, {
      //       stockChart: stockChart,
      //       periods: [
      //         { timeUnit: "day", count: 1, name: "1D" },
      //         { timeUnit: "day", count: 5, name: "5D" },
      //         { timeUnit: "month", count: 1, name: "1M" },
      //         { timeUnit: "month", count: 3, name: "3M" },
      //         { timeUnit: "month", count: 6, name: "6M" },
      //         { timeUnit: "ytd", name: "YTD" },
      //         { timeUnit: "year", count: 1, name: "1Y" },
      //         { timeUnit: "max", name: "Max" },
      //       ]
      //     })
      //   ],
      // });
      // Make stuff animate on load
      // https://www.amcharts.com/docs/v5/concepts/animations/
      valueSeries3.appear(1500);
      valueSeries2.appear(1000);
      valueSeries.appear(1000);
      mainPanel.appear(1000, 100);

      let legend = mainPanel.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(mainPanel.series.values);

      dataLoaded(apiData);
    });
  }

  ngOnDestroy() {
    // this.root.container.children.clear();
    // Clean up chart when the component is removed
    this.browserOnly(() => {
      if (this.root) {
        this.root.dispose();
      }
    });
  }
}
