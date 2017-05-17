var express = require("express");
var mysql = require('mysql');
var feed = require('feed-read');
var cron = require('node-cron');
var app = express();
var scrape = require('html-metadata');

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
  getFeed();
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
var images = [];

function addFeed(call){
  var sql1 = "SELECT * FROM feed.news WHERE link='"+news[index].link+"' AND title='"+news[index].title+"'";
  connection.query(sql1, function (err, result) {
    if (err) throw err;
    console.log("link:         "+news[index].link);
    console.log("tile:         "+news[index].title);
    console.log("content:      "+news[index].content);
    console.log("author:       "+news[index].author);
    console.log("published:    "+news[index].published);
    console.log("source:       "+news[index].feed.link);
    if(result.length > 0){
      console.log("this is exist", index, news[index].link);
    }else{
      if(images[index-1] != undefined){
        var sql = "INSERT INTO news (title, link, imageUrl, source, author, published_date, content) VALUES (?, ?, ?, ?, ?, ?, ?)"; 
        connection.query(sql, 
          [news[index].title, news[index].link, images[index-1], news[index].feed.link, news[index].author, String(news[index].published), news[index].content], 
          function (err, result2) {
            if (err) throw err;
            console.log("Data inserted", index, news[index].link);
          }
        );
        console.log("this is not exist", index);

      }
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
function getImage(call){
  for(var i = 0; i < 7; i++){
    scrape(news[i].link, function(error, metadata){
      if(metadata["twitter"]["image"]["src"])
        images.push(metadata["twitter"]["image"]["src"]);
      else
        images.push(metadata["twitter"]["image"]);
    });
  }
  console.log("getting images...");
  call();
}
function getFeed(){  
  for (var j = 0; j < urls.length; j++) {
    feed(urls[j], function(err, articles) {
      news = articles;
      getImage(function(){
        add();
      });
    });
  }
}
