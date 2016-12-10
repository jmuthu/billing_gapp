"use strict";
function log(message) {
  //stats.insertRowsBefore(4, 1);
  //stats.getRange(4,1).setValue(message);
  Logger.log(message);
}

function throwException(message) {
  log(message);
  throw message;
}

function getMonthFromString(month) {
  var monthList = {'January':0,'February':1,'March':2,'April':3,
                   'May':4,'June':5,'July':6,'August':7,
                   'September':8,'October':9,'November':10,'December':11}
  return monthList[month];
}

function daysInMonth(month,year) {
  return new Date(year, month+1, 0).getDate();
}


function getBalanceDataIndex(balanceData, month, year){
  var date = new Date(year, month,daysInMonth(month,year),0,0,0,0);
  var colIndex = -1;
  for(var i = 1; true; i = i+1) {
    var header = balanceData[0][i];
    if (header == undefined) {
      break;
    }else if (Object.prototype.toString.call(header) === "[object Date]" &&
    header.getTime() == date.getTime()) {
      colIndex = i;
      break;
    }
  }
  return colIndex;
}

function testCompare(){
  var d1 = new Date(2016,10,11);
  var d2 = new Date(2016,10,11);
  if (d1 >=d2) {
    log("true");
  }
}

function assert(data, type, name ){
  if(data == undefined) {
    throwException("Error! Missing " + type + " data for subscription " + name);
  }
}

function sort_unique_date(arr) {
    if (arr.length === 0) return arr;
    arr = arr.sort(function(a,b){return a - b});
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { // start loop at 1 as element 0 can never be a duplicate
        if (arr[i-1].getTime() != arr[i].getTime()) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function incrementDay(date) {
  var result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
}
