const request = require("request");
const cheerio = require('cheerio');
const fs = require('fs');
const data = './data';
const url = "http://shirts4mike.com/";
let UrlArray = [];
const fields = ["Title", "Price", "ImageUrl", "Url", "Time"];
var shirtsData = [];
const Json2csvParser = require('json2csv').Parser;
const opts = {
  fields
};

if (!fs.existsSync(data)) {
  fs.mkdirSync(data);
}

// make request from url
request(url + 'shirts.php', function(error, response, body) {
  if (error) {
    console.log("The site could not be scraped.");
    displayError(error);

  } else {
    var $ = cheerio.load(body);
    $("a[href*='id=']").each(function() {
      // Get the href of those links, and add that to the home page url
      var link = $(this);
      var href = link.attr("href");
      var newUrl = url + "/" + href;
      UrlArray.push(newUrl);
    })
    // second scrape to get product page infomation
    for (let i = 0; i < UrlArray.length; i++) {
      request(UrlArray[i], function(error, response, body) {
        if (error) {
          console.log("The site could not be scraped.");
          displayError(error);

        } else {
          var $ = cheerio.load(body);
          var price = $(".price").text();
          var shirtUrl = response.request.uri.href;
          var title = $(".shirt-details h1").text().slice(4);
          var imageUrl = url + $('.shirt-picture img').attr('src');
          var time = new Date().toLocaleString();
        }

        var shirtDetails = {
          Title: title,
          Price: price,
          ImageUrl: imageUrl,
          Url: shirtUrl,
          Time: time
        };
        shirtsData.push(shirtDetails);

        if (shirtsData.length == 8) {
          try {
            const parser = new Json2csvParser(opts);
            const csv = parser.parse(shirtsData);

            /** Create csv file with today's file name */

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = today.getFullYear();

            if (dd < 10) {
              dd = '0' + dd
            }

            if (mm < 10) {
              mm = '0' + mm
            }

            var today = mm + '-' + dd + '-' + yyyy;

            data


            /** If the data file for today already exists it should overwrite the file */
            fs.writeFile(data + "/" + today, csv, function(err) {
              if (err) throw err;
              console.log(today + ' created');
            }); //End fo writeFile




          } catch (err) {
            console.error(err);
          }
        }




      })
    }

  }
});



function displayError(error) {
  console.log(error.message);
  var errorTime = new Date().toLocaleString();
  var errorLog = error.message + " " + errorTime + '\n';

  // Writes to error log
  fs.appendFile('scraper-error.log', errorLog, function(error) {
    if (error) throw error;
  });
}
