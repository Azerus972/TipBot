'use strict';
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function getBTCPrice(){
  getDataFromAPI("https://api.coindesk.com/v1/bpi/currentprice/btc.json", true, function(data){
    let result = JSON.parse(data);
      if (result !== 'undefined'){
        if(result){
        var price = result.bpi.USD.rate;
          return price;
        }
      }
  });
};

function getDataFromAPI(url, sync, callback){
  let xmlHttp = new XMLHttpRequest();
  
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText);
    }
  };
  xmlHttp.open("GET", url, sync);
  xmlHttp.send(null);
}

module.exports.getBTCPrice = getBTCPrice();
