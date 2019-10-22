import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
declare let d3: any;
import { SensorStatusServiceService } from '../sensor-status-service.service';
import { SensorData } from '../sensor-data';
import * as socketio from 'socket.io-client';
import { Subject, from } from 'rxjs/';


@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LineChartComponent implements OnInit {
  configVariable = { refreshDataOnly: true };
  buffer: any = [];
  public options: any;
  public data: any = [];
  public chartType: any;
  public arr: any = [];
  static sensor: any = [];
  public arr1: any = [];
  public sensorStatus: any = [];
id;
  @ViewChild('nvd3') nvd3;

  constructor(private svc: SensorStatusServiceService) {
  }

  ngOnInit() {
this.id=3;
    // this.graphPlot();
this.getBackendData();
  }

  graphPlot() {



    this.options = {
      chart: {
        type: 'lineChart',
        height: 450,
        margin: {
          top: 20,
          right: 20,
          bottom: 40,
          left: 55
        },
        x: function (d) { return d.x; }, //d3.time.format('%X')(new Date(d.x))
        y: function (d) { return d.y; },
        useInteractiveGuideline: true,
        // transitionDuration:500,
        xAxis: {
          axisLabel: 'Time (hours:minutes:seconds)',
          tickFormat: function (d) {
            return d3.time.format('%I:%M:%S %p')(new Date(d));
          },
        },
        yAxis: {
          axisLabel: 'Temperature',
          tickFormat: function (d) {
            return d3.format('.02f')(d);
          },
          axisLabelDistance: -10
        }
      }
    };

    

  
     console.log('LineChartComponent.sensor',LineChartComponent.sensor);
    this.data=this.formatData(LineChartComponent.sensor);
   //  this.socketData();
  }
  //Response Data Convert to Chart Object
  formatData(serviceResponseData) {
    var items: any[] = [];
    var pushObject: any = {};
    for (var i = 0; i < serviceResponseData.length; i++) {
      let THG_TS = serviceResponseData[i].THG_TS;
      var date2 = new Date(THG_TS);
      let d1 = date2.getTime(); //date2.toLocaleTimeString();
      // this.arr = this.arr.slice(0, 20)
      pushObject = {
        x: d1,
        y: serviceResponseData[i].Temperature,
        key: serviceResponseData[i].s_infoId
      }
      items.push(pushObject);

    }
    var dataById = d3.nest()
      .key(function (d) { return d.key; })
      .entries(items);




    return dataById;
  }
  getBackendData() {
    this.graphPlot();
    this.svc.Get_Last1Hr(this.id).subscribe(
      // the first argument is a function which runs on success
      data => {
        
        let a: any = [];
        // last one hour data
        for (let i = 0; i < data.length; i++) {
          LineChartComponent.sensor.push(data[i]);
        }
        console.log(' LineChartComponent.sensor data', LineChartComponent.sensor);
     

            let dummy=this.formatData(LineChartComponent.sensor);
            for(let i=0;i<dummy.length;i++)
            {
            this.data.push(dummy[i]);
            }
            
         this.nvd3 && this.nvd3.chart && this.nvd3.chart.update();

       

        console.log(' this.data', this.data);

        this.buffer = this.data;
      },
      // the second argument is a function which runs on error
      err => console.log(err),
      // the third argument is a function which runs on completion
      () =>
        console.log('done loading last 1 hr'));

  }

  socketData() {
    //real time data
    let socket = socketio.connect('http://13.90.155.148:8030');//'http://13.76.162.62:3000'
    let sensorSub = new Subject<SensorData>();

    socket.on('data', (sensorStatus: string) => {
      sensorSub.next(JSON.parse(sensorStatus));

      //filter sensor ids as per sensors in that room
      let sid = LineChartComponent.sensor.filter(item => { return item.s_infoId == JSON.parse(sensorStatus).s_infoId });
      if (sid.length) {
        this.sensorStatus = [JSON.parse(sensorStatus)];

        for (let i = 0; i < this.data.length; i++) {
          if (this.data[i].key == sid[0].s_infoId) {
            let value = this.formatData(this.sensorStatus);
            for (let j = 0; j < value[0].values.length; j++) {
              this.data[i].values.push(value[0].values[j]);
              this.nvd3 && this.nvd3.chart && this.nvd3.chart.update();
            }

          }
        }
       
        console.log(' this.graphdata', this.data);
      }
    });
  }

}
