import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { Data } from 'src/app/core/models/data.models';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from "@amcharts/amcharts5/stock";


@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit, OnChanges {

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
      this.createGraph(this.datoschart, "linechartdiv", "chartcontrols");
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
          numericFields: ["dataHum2"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        valueSeries.data.setAll(result);
        valueSeries2.data.setAll(result);
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
          labelText: "{name}: {valueY}%"
        })
      }));


      let legend = mainPanel.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(mainPanel.series.values);

      // ========================= RANGOS ====================================
      // add saturation range
      // let saturationRangeDataItem = valueAxis.makeDataItem({ value: 50, endValue: 16 });
      // valueSeries.createAxisRange(saturationRangeDataItem);

      // saturationRangeDataItem.get("axisFill").setAll({
      //   fill: am5.color("#86dbf0"),
      //   fillOpacity: 1,
      //   visible: true
      // });

      // saturationRangeDataItem.get("label").setAll({
      //   location: 0,
      //   visible: true,
      //   text: "WC",
      //   inside: true,
      //   centerX: 0,
      //   centerY: am5.p100,
      //   fontWeight: "bold",
      //   fill: am5.color(0xffffff),
      //   background: am5.RoundedRectangle.new(root, {
      //     fill: am5.color("#668f64")
      //   }),
      // })

      // // add optimo range
      // let optimoRangeDataItem = valueAxis.makeDataItem({ value: 16, endValue: 14.5 });
      // let optimoRange = valueSeries.createAxisRange(optimoRangeDataItem);

      // optimoRangeDataItem.get("axisFill").setAll({
      //   fill: am5.color("#98f086"),
      //   fillOpacity: 1,
      //   visible: true
      // });

      // optimoRangeDataItem.get("label").setAll({
      //   location: 0,
      //   visible: true,
      //   text: "WC",
      //   inside: true,
      //   centerX: 0,
      //   centerY: am5.p100,
      //   fontWeight: "bold",
      //   fill: am5.color(0xffffff),
      //   background: am5.RoundedRectangle.new(root, {
      //     fill: am5.color("#3ead4f")
      //   }),
      // })

      // // add caution range
      // let cautionRangeDataItem = valueAxis.makeDataItem({ value: 14.5, endValue: 14 });
      // let cautionRange = valueSeries.createAxisRange(cautionRangeDataItem);

      // cautionRangeDataItem.get("axisFill").setAll({
      //   fill: am5.color("#faf8a2"),
      //   fillOpacity: 1,
      //   visible: true
      // });

      // cautionRangeDataItem.get("label").setAll({
      //   inside: true,
      //   fill: am5.color("#11120b"),
      //   text: "UR",
      //   background: am5.RoundedRectangle.new(root, {
      //     fill: am5.color("#cfdb27")
      //   }),
      //   location: 0,
      //   visible: true,
      //   centerX: 0,
      //   centerY: am5.p100,
      //   fontWeight: "bold"
      // })

      // // add pmp series range
      // let pmpRangeDataItem = valueAxis.makeDataItem({ value: 14, endValue: 0 });
      // let urRange = valueSeries.createAxisRange(pmpRangeDataItem);

      // urRange.strokes.template.set("stroke", am5.color("#f50a45"));

      // pmpRangeDataItem.get("grid").setAll({
      //   strokeOpacity: 1,
      //   visible: true,
      //   stroke: am5.color("#fa1e38"),
      //   strokeDasharray: [5, 5]
      // })

      // pmpRangeDataItem.get("axisFill").setAll({
      //   fill: am5.color("#f59ab8"),
      //   fillOpacity: 1,
      //   visible: true
      // });

      // pmpRangeDataItem.get("label").setAll({
      //   inside: true,
      //   fill: am5.color(0xffffff),
      //   text: "PMP",
      //   background: am5.RoundedRectangle.new(root, {
      //     fill: am5.color("#f50a45")
      //   }),
      //   location: 0,
      //   visible: true,
      //   centerX: 0,
      //   centerY: am5.p100,
      //   fontWeight: "bold"
      // })

      // Add scrollbar
      // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
      // mainPanel.set("scrollbarX", am5.Scrollbar.new(root, {
      //   orientation: "horizontal"
      // }));

      // Eliminar el toolbar anterior si existe
      if (this.toolbar) {
        this.toolbar.dispose();
      }

      // Add toolbar
      // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
      this.toolbar = am5stock.StockToolbar.new(root, {
        container: document.getElementById("chartcontrols"),
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
