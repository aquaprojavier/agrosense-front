import { Component, Inject, NgZone, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import { Data } from 'src/app/core/models/data.models';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from "@amcharts/amcharts5/stock";
import * as am5plugins_exporting from "@amcharts/amcharts5/plugins/exporting";

@Component({
  selector: 'app-flow-chart',
  templateUrl: './flow-chart.component.html',
  styleUrls: ['./flow-chart.component.scss']
})
export class FlowChartComponent implements OnChanges {

  private root!: am5.Root;
  toolbar: any;
  @Input() datoschart: Data[];
  
  constructor(@Inject(PLATFORM_ID)
  private platformId: Object,
    private zone: NgZone,
  ) { }

  
  ngOnChanges(changes: SimpleChanges) {
    // Check if the datoschart input has changed
    if (changes.datoschart && !changes.datoschart.firstChange) {
      // If it has changed and it's not the first change, create the graph
      this.createGraph(this.datoschart, "flowdiv");
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
        panX: true,
        panY: false,
        pinchZoomX: true,
        layout: root.verticalLayout
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
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm:ss"
        });
        // Set the data processor and data for valueSeries2
        valueSeries2.data.processor = am5.DataProcessor.new(root, {
          dateFields: ["dataFecha"],
          dateFormat: "yyyy-MM-dd HH:mm:ss"
        });
        valueSeries.data.setAll(result);
        valueSeries2.data.setAll(result);
        sbSeries.data.setAll(result);
      }

      let valueSeries = mainPanel.series.push(am5xy.SmoothedXLineSeries.new(root, {
        name: "Caudal",
        valueXField: "dataFecha",
        valueYField:  "flow",
        stroke: am5.color("#0981eb"),
        xAxis: dateAxis,
        yAxis: valueAxis,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY} m3/hr",
          keepTargetHover: true
        })
      }));

      let valueSeries2 = mainPanel.series.push(am5xy.SmoothedXLineSeries.new(root, {
        name: "Presion",
        valueXField: "dataFecha",
        valueYField: "presion",
        stroke: am5.color("#3eedd3"),
        xAxis: dateAxis,
        yAxis: valueAxis2,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{name}: {valueY} Kg/cm2",
          keepTargetHover: true
        })
      }));

      let legend = mainPanel.children.push(am5.Legend.new(root, {}));
      legend.data.setAll(mainPanel.series.values);

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

      let sbSeries = scrollbar.chart.series.push(am5xy.SmoothedXLineSeries.new(root, {
        valueYField: "flow",
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

      // Make stuff animate on load
      // https://www.amcharts.com/docs/v5/concepts/animations/
      valueSeries2.appear(1000);
      valueSeries.appear(1000);
      mainPanel.appear(1000, 100);

      //modal para en caso de no haber datos
      if (apiData.length === 0) {
        // Si no hay datos, muestra el modal proporcionado por amCharts
        this.showNoDataModal(root, divId);
      } else {
        // Si hay datos, continúa con el proceso normal para renderizar el gráfico
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
