var http = require("http");
var express = require('express');
var app = express();
var cron = require('node-cron');
var feed = require('feed-read')
var scrape = require('html-metadata');
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
  // if(redirectPort !== null){
  //   var redirectUrl = 'http://localhost:' + redirectPort + req.url;
  //   res.redirect(redirectUrl);
  // }
  // else{
    // var list = JSON.stringify(getFeed());
    res.send(JSON.stringify({ a: 1, feed: JSON.stringify(getFeed())}));
    
  // }
})
// testing path
app.get('/test',function(req,res){  
  res.send("server 1");
})
// feed read
urls = [
    // "http://newtimes.kz/rss",
    // "https://ru.sputniknews.kz/export/rss2/archive/index.xml",
    "https://kapital.kz/feed"
    // "http://feeds.bbci.co.uk/news/technology/rss.xml",
    // "http://feeds.skynews.com/feeds/rss/technology.xml",
    // "http://www.techmeme.com/feed.xml"
];
function getFeed(){  
  var list = [];
  for (var j = 0; j < urls.length; j++) {
    feed(urls[j], function(err, articles) {
      for (var i = 0; i < 5; i++) {
        list.push({
          site: 'kapital.kz',
          title: articles[i].title,
          link: articles[i].link,
          content: articles[i].content,
          published_time: articles[i].published,
        });
        // if(i === 20)
        //   break;
        if( i === articles.length-1 && j === urls.length-1) {
          // res.end("</body>\n</html>"); e
        } 
      } 
    }); 
  }
  setTimeout(function() {
    return list;
  }, 4000);
  return list;

}
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
