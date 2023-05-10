import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { Data } from 'src/app/core/models/data.models';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from "@amcharts/amcharts5/stock";


@Component({
  selector: 'app-temp-hum-chart',
  templateUrl: './temp-hum-chart.component.html',
  styleUrls: ['./temp-hum-chart.component.scss']
})
export class TempHumChartComponent implements OnInit, OnChanges {

   private root!: am5.Root;
  toolbar: any;
  @Input() datoschart: Data[];

  constructor(@Inject(PLATFORM_ID)
  private platformId: Object,
    private zone: NgZone,
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if the datoschart input has changed
    if (changes.datoschart && !changes.datoschart.firstChange) {
      // If it has changed and it's not the first change, create the graph
      this.createGraph(this.datoschart, "chartdiv", "chartcontrols2");
    }
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

  createGraph(apiData: Data[], divId, chartcontrols) {
    // Chart code goes in here
    this.browserOnly(() => {

      // Dispose previously created Root element
      this.maybeDisposeRoot(divId);
      this.maybeDisposeRoot(chartcontrols);

      // Remove content from chart divs
      let chartcontrolsDiv = document.getElementById(chartcontrols);
      while (chartcontrolsDiv.firstChild) {
        chartcontrolsDiv.removeChild(chartcontrolsDiv.firstChild);
      }

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
        panX: true,
        panY: false,
        pinchZoomX: true
      }));

      // Create axes
      // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
      let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      }));

      let valueAxis2 = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
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

      mainPanel.set("cursor", am5xy.XYCursor.new(root, {
        yAxis: valueAxis,
        xAxis: dateAxis,
        behavior: "zoomX"
      }));

      function dataLoaded(result) {
        // Set data on all series of the chart
        valueSeries.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum1", "cc", "ur"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm:ss"
        });
        // Set the data processor and data for valueSeries2
        valueSeries2.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum2"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm:ss"
        });
        valueSeries.data.setAll(result);
        valueSeries2.data.setAll(result);
      }

      let valueSeries = mainPanel.series.push(am5xy.LineSeries.new(root, {
        name: "Temperatura",
        valueXField: "dataFecha",
        valueYField: "dataTemp",
        stroke: am5.color("#0981eb"),
        xAxis: dateAxis,
        yAxis: valueAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY} C"
        })
      }));

      let valueSeries2 = mainPanel.series.push(am5xy.LineSeries.new(root, {
        name: "Humedad Relativa",
        valueXField: "dataFecha",
        valueYField: "dataHr",
        stroke: am5.color("#3eedd3"),
        xAxis: dateAxis,
        yAxis: valueAxis2,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY} %"
        })
      }));

      let legend = mainPanel.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(mainPanel.series.values);
      
      // Add scrollbar
      // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
      // mainPanel.set("scrollbarX", am5.Scrollbar.new(root, {orientation: "horizontal"
      // }));

      // Eliminar el toolbar anterior si existe
      if (this.toolbar) {
        this.toolbar.dispose();
      }

      // Add toolbar
      // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
      this.toolbar = am5stock.StockToolbar.new(root, {
        container: document.getElementById("chartcontrols2"),
        stockChart: stockChart,
        controls: [
          am5stock.DateRangeSelector.new(root, {
            stockChart: stockChart
          }),
          am5stock.PeriodSelector.new(root, {
            stockChart: stockChart
          })
        ]
      });

      // Make stuff animate on load
      // https://www.amcharts.com/docs/v5/concepts/animations/
      valueSeries2.appear(1000);
      valueSeries.appear(1000);
      mainPanel.appear(1000, 100);

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

