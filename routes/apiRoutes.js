var db = require("../models");
var request = require('request');

module.exports = function (app) {

  app.post("/api/googleapi", function (req, res) {
    var barArr = JSON.parse("[" + req.body.barList + "]");
    var barArr2 = [];
    console.log('');
    console.log("These are the ids of the filtered bars from the database: " + barArr);
    var morePromises = [];
    var correctedArr = [];

    barArr.forEach(function (bar) {
      morePromises.push(
        db.Bar.findOne({
          where: {
            id: bar
          }
        }))
    });
    Promise.all(morePromises).then(function (res) {
      res.forEach(element => {
        barArr2.push(element.street + "," + element.zip)
      });
      console.log("Bar address array:");
      console.log(barArr2);

      // Google Maps API Query Start    
      var apikey = "&key=AIzaSyDu0Qtc37kImb-6q2CGWi-T9DeM0s80ZIk&"

      // Wanna learn how to use parameters as an object...
      // var params = {
      //   origin: barArr2[0] + "Charlotte+NC&", // Starting Address 
      //   destination: barArr2[1],   
      //   mode: "walking&", // Mode of Travel; Can be 'driving', 'walking', 'bicycling', or 'transit';
      //   waypoints: "waypoints=optimize:true",
      //   // Waypoints are extra stops in between the origin and destination; To be formatted as follows:
      //   // &waypoints=Charlotte|Raleigh|... 
      //   // You can supply one or more locations separated by the pipe character (|), in the form of an address, latitude/longitude coordinates, or a place ID:
      // }

      var queryUrl = "https://maps.googleapis.com/maps/api/directions/json?origin=" + barArr2[0] + "&destination=" + barArr2[1] + "&mode=walking&waypoints=optimize:true|";
      console.log('------------------------------------');
      console.log("Running URL address loop for " + Number(barArr2.length - 2) + " addresses!");
      console.log('------------------------------------');

      for (var i = 2; i < barArr2.length; i++) {
        queryUrl = queryUrl + (barArr2[i] + "|");
      };
      queryUrl = queryUrl + apikey;
      console.log("");
      console.log(queryUrl);

      request(queryUrl, function (error, response, body) {
        if (error) {
          console.log("error:", error);
        }; // Print the error if one occurred        
        console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
        console.log("Google API:");
        var google = JSON.parse(body).routes[0];
        // console.log(JSON.parse(body).routes[0].legs);
        console.log("Starting Address: " + google.legs[0].start_address);
        console.log("Waypoint order: " + google.waypoint_order);
        google.legs.forEach(element => {
          console.log(element.end_address);
        });
        console.log(google.waypoint_order);
        console.log("");
        console.log("Bar IDs in original order:" );
        console.log(barArr);
        correctedArr.push(barArr[0]);
        for (var i = 0; i < google.waypoint_order.length; i++){
          var waypointId = google.waypoint_order[i] + 2;
          correctedArr.push(barArr[waypointId]);
        }
        correctedArr.push(barArr[1]);
        console.log ("Adjusted Route:");
        console.log (correctedArr);
      });
    });
  });

  app.post("/api/posts", function (req, res) {
    console.log(req.body.barList);
    db.Crawl.create({
        crawlName: req.body.crawlName,
        barList: req.body.barList.toString()
      })
      .then(function (dbcrawl) {
        res.json(dbcrawl);
      });

    console.log(req.body);
    db.Crawl.create(req.body).then(function (dbcrawl) {
      res.json(dbcrawl);
    });
  });


  app.get("/crawl/:crawl", function (req, res) {
    db.Crawl.findOne({
      where: {
        crawlName: req.params.crawl
      }
    }).then(function (crawlInfo) {
      var barArray = [];
      var promises = [];
      var crawlArray = JSON.parse("[" + crawlInfo.dataValues.barList + "]");
      console.log(crawlArray)
      crawlArray.forEach(function (position) {
        promises.push(
          db.Bar.findOne({
            where: {
              id: position
            }
          }))
      });
      Promise.all(promises).then(function (barsAr) {
        console.log(barArray);
        res.render("results", {
          bars: barsAr
        });
      });
    });
  });
  app.get("/api/neighborhood/:hood", function (req, res) {
    console.log(req.params.hood)
    db.Bar.findAll({
      where: {
        neighborhood: req.params.hood
      }
    }).then(function (sendthehood) {
      res.render("hood", {
        hood: sendthehood
      });
    });
  })
}