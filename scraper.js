const request = require("request");
const cheerio = require('cheerio');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;
const data = './data';
const url = "http://shirts4mike.com/";
const fields = ["Title", "Price", "ImageUrl", "Url", "Time"];
const opts = {};
let shirtsData = [];
let UrlArray = [];

// creating data folder if one doesn't exist
if (!fs.existsSync(data)) {
  fs.mkdirSync(data);
}

// make request from url
request(url + 'shirts.php', function(error, response, body) {
  if (error) {
    console.log("The site could not be scraped.");
    displayError(error);

  } else {
    const $ = cheerio.load(body);
    $("a[href*='id=']").each(function() {
      // Get the href of those links, and add that to the home page url
      let link = $(this);
      let href = link.attr("href");
      let newUrl = url + "/" + href;
      UrlArray.push(newUrl);
    });

    // second scrape to get product page infomation
    for (let i = 0; i < UrlArray.length; i++) {
      request(UrlArray[i], function(error, response, body) {
        if (error) {
          console.log("The site could not be scraped.");
          displayError(error);

        } else {
          const $ = cheerio.load(body);
          var price = $(".price").text(); //have to be var as let limits the scope
          var shirtUrl = response.request.uri.href;
          var title = $(".shirt-details h1").text().slice(4);
          var imageUrl = url + $('.shirt-picture img').attr('src');
          var time = new Date().toLocaleString();
        }

        // object to hold shirt details
        let shirtDetails = {
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

            // create csv file with today's file name

            let today = new Date();
            let dd = today.getDate();
            let mm = today.getMonth() + 1; //jan is 0
            let yyyy = today.getFullYear();
            if (dd < 10) {
              dd = '0' + dd;
            }
            if (mm < 10) {
              mm = '0' + mm;
            }
            today = yyyy + '-' + mm + '-' + dd;

            // ff the data file for today already exists it should overwrite the file
            fs.writeFile(data + "/" + today + ".csv", csv, function(err) {
              if (err) throw err;
              console.log(today + ".csv created");
            }); //end of writeFile
          } catch (err) {
            console.error(err);
          }
        }
      });
    }
  }
});

// error function passing in date and time
function displayError(error) {
  console.log(error.message);
  let errorTime = new Date().toLocaleString();
  let errorLog = error.message + " " + errorTime + '\n'; //puts errors on new line

  // writes to error log
  fs.appendFile('scraper-error.log', errorLog, function(error) {
    if (error) throw error;
  });
}
