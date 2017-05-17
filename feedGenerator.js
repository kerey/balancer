var express = require("express");
var mysql = require('mysql');
var feed = require('feed-read');
var cron = require('node-cron');
var app = express();

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

app.get("/",function(req,res){
  res.send(JSON.stringify({ port: 5000, server: 6, purpose: 'collect feed from resources by cron job'}));
});

app.listen(5000);
// cron job
cron.schedule('*/30 * * * * *', function(){
  getFeed()
});
// feed read
var urls = [
    "http://newtimes.kz/rss",
    "https://ru.sputniknews.kz/export/rss2/archive/index.xml",
    "https://kapital.kz/feed"
];
var index = 1;
var news = [];

function addFeed(call){
  var sql1 = "SELECT * FROM feed.news WHERE link='"+news[index].link+"' AND title='"+news[index].title+"'";
  connection.query(sql1, function (err, result) {
    if (err) throw err;
    if(result.length > 0){
      console.log("this is exist", index, news[index].link);
    }else{
      var sql = "INSERT INTO news (title, link) VALUES (?, ?)"; 
      connection.query(sql, [news[index].title, news[index].link], function (err, result) {
        if (err) throw err;
        console.log("Data inserted", index, news[index].link);
      });
      console.log("this is not exist", index);
    }
    index++;
    call();
  });
}

function add(){
  addFeed(function(){
    addFeed(function(){
      addFeed(function(){
        addFeed(function(){
          addFeed(function(){
            addFeed(function(){
              addFeed(function(){
                index = 1;
              });
            });
          });
        });
      });
    });
  });
}

function getFeed(){  
  for (var j = 0; j < urls.length; j++) {
    feed(urls[j], function(err, articles) {
      news = articles;
      add();
    });
  }
}
