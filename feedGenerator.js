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
  // getFeed()
});
// feed read
var urls = [
    "http://newtimes.kz/rss",
    // "https://ru.sputniknews.kz/export/rss2/archive/index.xml",
    // "https://kapital.kz/feed"
];
var index = 0;
var news = [];

function addFeed(call){
  console.log("in add feed");
  var sql1 = "SELECT * FROM feed.news WHERE link='"+news[index].link+"' AND title='"+news[index].title+"'";
  connection.query(sql1, function (err, result) {
    if (err) throw err;
    if(result.length > 0){
      console.log("this is exist..", index, news[index].link);
    }else{
      var sql = "INSERT INTO news (title, link, imageUrl, description, source, author, published_date, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"; 
      connection.query(sql, 
        [news[index].title, news[index].link, "", "", news[index].feed.link, news[index].author, String(news[index].published), news[index].content], 
        function (err, result2) {
          if (err) throw err;
          console.log("Data inserted..", index, news[index].link);
        }
      );
      console.log("this is not exist..", index);
    }
    index++;
    call();
  });
}

function add(){
  console.log("in add...");
  addFeed(function(){
    addFeed(function(){
      addFeed(function(){
        addFeed(function(){
          addFeed(function(){
            addFeed(function(){
              addFeed(function(){
              });
            });
          });
        });
      });
    });
  });
}
function update(){
  console.log("in update...");
  updateFeed(function(){
    updateFeed(function(){
      updateFeed(function(){
        updateFeed(function(){
          updateFeed(function(){
            updateFeed(function(){
              updateFeed(function(){
              });
            });
          });
        });
      });
    });
  });
}
function updateFeed(call){
  console.log("in update feed");

  scrape(news[index].link, function(error, metadata){
    console.log(news[index].link);
    if(metadata["twitter"]["image"])
      news[index].image = metadata["twitter"]["image"];
    if(metadata["twitter"]["image"]["src"])
      news[index].image = metadata["twitter"]["image"]["src"];
    if(metadata["twitter"]["description"]){
      news[index].description = metadata["twitter"]["description"];
    }
    var sql = "UPDATE news SET imageUrl=?, description=? WHERE link='"+news[index].link+"' AND title='"+news[index].title+"'"; 
    connection.query(sql, [news[index].image, news[index].description], 
      function (err, result2) {
        if (err) throw err;
        console.log("Data updated..", index, news[index].link);
        index++;
        call();
      }
    );
  });
}
function getFeed(){  
  feed("https://kapital.kz/feed", function(err, articles) {
    console.log("in get feed...");
    index = 0;
    news = articles;
    add();
    setTimeout(function(){
      index = 0;
      update();
    }, 10000);
  });
}
