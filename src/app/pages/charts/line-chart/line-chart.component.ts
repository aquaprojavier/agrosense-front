import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { Data } from 'src/app/core/models/data.models';
import { Soil } from 'src/app/core/models/soil.model';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from "@amcharts/amcharts5/stock";
import * as am5plugins_exporting from "@amcharts/amcharts5/plugins/exporting";
import { Device } from 'src/app/core/models/device.models';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnChanges {

  private root!: am5.Root;
  toolbar: any;
  @Input() datoschart: Data[];
  @Input() device: Device;
  cc: number;
  pmp: number;
  ur: number;
  datos: Data[] = [];
  deviceId: number = 1;
  soil: Soil;
  selectedDays: number = 30; // Valor predeterminado, puedes ajustarlo según tu lógica

  constructor(@Inject(PLATFORM_ID)
  private platformId: Object,
    private zone: NgZone,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    // Check if the datoschart input has changed
    if (changes.datoschart && !changes.datoschart.firstChange) {
      // If it has changed and it's not the first change, create the graph
      this.getSoil();
      this.createGraph(this.datoschart, "linechartdiv");
    }
  }

  getSoil() {
    this.soil = this.device.soil
    this.cc = this.soil.cc;
    this.pmp = this.soil.pmp;
    this.ur = (this.cc + this.pmp) * (this.soil.ur / 100);
    // console.log(this.soil)
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

  showNoDataModal(root: am5.Root, divId: string) {
    // Utiliza el método `Modal` de amCharts para mostrar un modal cuando no hay datos
    let modal = am5.Modal.new(root, {
      content: "No hay datos disponibles para este rango de fechas, pruebe otro..."
    });
    // Abre el modal
    modal.open();
    // Puedes agregar más configuraciones o acciones según sea necesario para tu modal
    // Por ejemplo, puedes cerrar el modal después de un tiempo determinado
    // setTimeout(() => {
    //   modal.close();
    // }, 3000); // Cierra el modal después de 3 segundos (por ejemplo)
  }

  formatDataFecha(data) {
    const formattedData = data.map(item => {
      // Convertir milisegundos a objeto Date
      const date = new Date(item.dataFecha);
      // Formatear la fecha según el formato "yyyy-MM-dd HH:mm"
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      // Devolver un nuevo objeto con la fecha formateada
      return { ...item, dataFecha: formattedDate };
    });

    return formattedData;
  }

  cleanNullData(data: any[]): any[] {
    const cleanedData = data.map(item => {
      const cleanedItem: any = {};

      Object.entries(item).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'dataId') {
          cleanedItem[key] = value;
        }
      });

      return cleanedItem;
    });

    return cleanedData;
  }


  createGraph(apiData: Data[], divId) {
    // Chart code goes in here
    this.browserOnly(() => {

      // Dispose previously created Root element
      this.maybeDisposeRoot(divId);

      // Remove content from chart divs
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
        min: this.pmp - 5,
        max: this.cc + 5,
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
          numericFields: ["dataHum1"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        // Set the data processor and data for valueSeries2
        valueSeries2.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum2"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        // Set the data processor and data for valueSeries3
        valueSeries3.data.processor = am5.DataProcessor.new(root, {
          numericFields: ["dataHum"],
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm"
        });
        valueSeries.data.setAll(result);
        valueSeries2.data.setAll(result);
        valueSeries3.data.setAll(result);
        sbSeries.data.setAll(result);
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

      //setting exporting menu
      let exporting = am5plugins_exporting.Exporting.new(root, {
        menu: am5plugins_exporting.ExportingMenu.new(root, {
          container: document.getElementById(divId)
        }),
        dataSource: this.cleanNullData(this.formatDataFecha(apiData)),
        pdfOptions: {
          addURL: true,
          fontSize: 10,
          pageSize: "A4",
          includeData: true
        }
      });

      exporting.get("menu").set("items", [
        {
          type: "format",
          format: "xlsx",
          label: "Export xlsx"
        }, {
          type: "format",
          format: "jpg",
          label: "Export jpg"
        }, {
          type: "format",
          format: "pdf",
          label: "Export pdf"
        }, {
          type: "separator"
        }, {
          type: "format",
          format: "print",
          label: "Print chart"
        }]);


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

      //dispara modal en caso de no haber datos
      if (apiData.length === 0) {
        // Si no hay datos, muestra el modal proporcionado por amCharts
        this.showNoDataModal(root, divId);
      } else {
        // Si hay datos, continúa con el proceso normal para renderizar el gráfico
        // dataLoaded(apiData);
        dataLoaded(apiData);
      }
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
