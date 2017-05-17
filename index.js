var http = require("http");
var express = require('express');
var app = express();
var cron = require('node-cron');

var timeR = [
  {port: 3000, time: 9000000},
  {port: 3001, time: 9000000},
  {port: 3002, time: 9000000},
  {port: 3003, time: 9000000},
  {port: 3004, time: 9000000}
];
var countAll = 0; 
var redirectPort = null;
var listenPort = 3000;
app.listen(listenPort);

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Content-Type', 'application/json');
  next();
});
app.get('/',function(req, res, next){  
  if(redirectPort !== null){
    var redirectUrl = 'http://localhost:' + redirectPort + req.url;
    res.redirect(redirectUrl);
  }
  else{
    res.send(JSON.stringify({ a: 2 }));
    
  }
})
// testing path
app.get('/test',function(req,res){  
  res.send("server 0");
})
// cron job
cron.schedule('*/15 * * * * *', function(){
  research()
});

function research(){
  // console.log("In research...");
  var ports = [3000, 3001, 3002, 3003, 3004];
  for (var i = 0; i < ports.length; i++) {
    var t1 = Date.now();
    
    search(ports[i], t1);
  }
}
function search(port, t1){
  // console.log("In search...");
  // var t = Date.now();
  // var t2;
  var options = {
    host: 'localhost',
    port: port,
    path: '/test',
  };
  var req = http.request(options, function (res) {
    // console.log('Request took:', new Date() - t1, 'ms');
    time = new Date()-t1;
    console.log("time is:", time);//the time needed to do the request
    for(var item in timeR){
      if(timeR[item].port === port){
        timeR[item].time = time;
      }
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      // console.log("body: " + chunk);
    });
    res.on('end', function() {
      console.log("success !");
      // res.send('ok');
      // t2 = Date.now();
      // time = t2-t1;
      // console.log("time is:", time);//the time needed to do the request
      // for(var item in timeR){
      //   if(timeR[item].port === port){
      //     timeR[item].time = time;
      //   }
      // }
      countAll++;

      findOptima();
    })
  });
  req.on('error', function (e) {
    countAll++;
    console.log("error");
    for(var item in timeR){
      if(timeR[item].port === port){
        timeR[item].time = 9000000;
        console.log("Port ", port, "not works, ERROR #9");
        findOptima();
      }
    }
  });
  req.end();
}
function findOptima(){
  // console.log("in FindOptima...");
  console.log(countAll);
  // console.log(timeR) 
  timeR.sort(
    function(a,b) {
      return (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0);
    } 
  ); 
  console.log(timeR);
  findRedirectPort();
}
function findRedirectPort(){
  if(timeR[0].port === listenPort || timeR[0].time == 9000000 || timeR[timeR.length-1].port !== listenPort){
    redirectPort = null;
  }else{
    redirectPort = timeR[0].port;
    console.log("Redirect port: "+redirectPort);
  }
  countAll = 0;
}
