var dataList = [];
var start_year = 2024;
var end_year = 2024;
var end_month = 1;
var currentCount = 0;

function arrayToCSV(data) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ("" + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractDataFromHtml(html) {
  var extractedData = [];
  $(html)
    .find("tr")
    .each(function () {
      var date = $(this).find(".blDate").text();
      var item = $(this).find(".blMeans").text();
      var point = $(this)
        .find(".blPoint")
        .text()
        .replace(/[^0-9]/g, "");

      if (date && item && point) {
        extractedData.push({
          date: date,
          item: item,
          point: parseInt(point, 10),
        });
      }
    });
  return extractedData;
}

function countOccurrences(target, searchString) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(target, "text/html");
  var linkElement = doc.querySelector("a[title='마지막 페이지로 이동하기']");
  if (linkElement) {
    var href = linkElement.getAttribute("href");
    var regex = /n4PageNo=(\d+)/;
    var match = href.match(regex);

    if (match) {
      var pageNo = match[1];
      return parseInt(pageNo) + 1;
    } else {
      console.log("No matching number found");
    }
  }

  var regex = new RegExp(searchString, "g");
  var matches = target.match(regex);

  return matches ? matches.length + 1 : 0;
}

async function getrequest(year, month, page = 0) {
  var xhr = new XMLHttpRequest();

  xhr.open(
    "GET",
    "https://user.nexon.com/mypage/page/nx.aspx?url=cash/uselist&year=" +
      year +
      "&month=" +
      month +
      "&n4PageNo=" +
      page,

    false
  );

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        currentCount = countOccurrences(xhr.responseText, "n4PageNo=");
        if (page != 0) {
          var data = extractDataFromHtml(xhr.responseText);
          dataList = dataList.concat(data);
          console.log(data);
        }
      } else {
        console.error("XHR 요청 오류:", xhr.statusText);
      }
    }
  };

  xhr.send();
}

for (var i = start_year; i <= end_year; i++) {
  for (var j = 1; j <= 12; j++) {
    {
      await delay(500);
      getrequest(i, j);
      for (var k = 1; k <= currentCount; k++) {
        await delay(500);
        console.log(i, j, k);
        getrequest(i, j, k);
      }
      if (i == end_year && j == end_month) break;
      currentCount = 0;
    }
  }
}

var csvData = arrayToCSV(dataList);
var BOM = "\uFEFF";
var blob = new Blob([BOM + csvData], { type: "text/csv;charset=utf-8;" });
var url = URL.createObjectURL(blob);

var a = document.createElement("a");
a.href = url;

a.download = "넥슨결제내역"+start_year+"년1월~"+end_year+"년"+end_month+"월.csv";
document.body.appendChild(a);
a.click();

document.body.removeChild(a);
URL.revokeObjectURL(url);
