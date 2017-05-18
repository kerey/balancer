var http = require("http");
var express = require('express');
var app = express();
var cron = require('node-cron');
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'feed'
});

connection.connect(function(err){
  if(!err)
    console.log("Database is connected ... \n\n");  
  else
    console.log("Error connecting database ... \n\n");  
});

var timeR = [
  {port: 3000, time: 9000000},
  {port: 3001, time: 9000000},
  {port: 3002, time: 9000000},
  {port: 3003, time: 9000000},
  {port: 3004, time: 9000000}
];
var countAll = 0; 
var redirectPort = null;
var listenPort = 3001;
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
    var sql = "SELECT * FROM feed.news ORDER BY id DESC LIMIT 100";
    connection.query(sql, function (err, result) {
      if (err) throw err;
      console.log(result);
      res.send(JSON.stringify({ feed: result }));
    });
    
  }
})
// testing path
app.get('/test',function(req,res){  
  res.send("server 1");
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
  var options = {
    host: 'localhost',
    port: port,
    path: '/test',
  };
  var req = http.request(options, function (res) {
    time = new Date() - t1;
    for(var item in timeR){
      if(timeR[item].port === port){
        timeR[item].time = time;
      }
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
    });
    res.on('end', function() {
      countAll++;
      findOptima();
    })
  });
  req.on('error', function (e) {
    countAll++;
    // console.log("error");
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
  // console.log(countAll);
  // console.log(timeR) 
  timeR.sort(
    function(a,b) {
      return (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0);
    } 
  ); 
  // console.log(timeR);
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
