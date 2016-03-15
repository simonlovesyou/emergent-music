'use strict';
import d3 from 'd3';


window.graph = function(name, data) {

  var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .x(function(d) { return x(d.iteration); })
      .y(function(d) { return y(d.data); });

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  console.log(data);

  x.domain(d3.extent(data, function(d) { return d.iteration; }));
  y.domain(d3.extent(data, function(d) { return d.data; }));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(name);

  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);
}

window.graphTimeline = function(lanes, data) {
  let laneLength = lanes.length,

  items = data.map(d => {
    return {
      "lane": lanes.indexOf(d.y),
      "id": '',
      "start": d.x0,
      "end": d.x1
    }
  });

  let timeBegin = 0;
  let timeEnd = data[data.length-1].x1;
  var m = [0, 15, 0, 50], //top right bottom left
    w = 1500 - m[1] - m[3],
    h = 700 - m[0] - m[2],
    miniHeight = laneLength * 12 + 50,
    mainHeight = h - miniHeight - 50;

  //scales
  var x = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([0, w]);
  var x1 = d3.scale.linear()
      .range([0, w]);
  var y1 = d3.scale.linear()
      .domain([0, laneLength])
      .range([0, mainHeight]);
  var y2 = d3.scale.linear()
      .domain([0, laneLength])
      .range([0, miniHeight]);

  var chart = d3.select("body")
        .append("svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .attr("class", "chart");
  
  chart.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", w)
    .attr("height", mainHeight);


  /*var main = chart.append("g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
        .attr("width", w)
        .attr("height", mainHeight)
        .attr("class", "main");*/

  var mini = chart.append("g")
        .attr("transform", "translate(" + m[3] + "," + (mainHeight + m[0]) + ")")
        .attr("width", w)
        .attr("height", miniHeight)
        .attr("class", "mini");
  
  //main lanes and texts
  /*main.append("g").selectAll(".laneLines")
    .data(items)
    .enter().append("line")
    .attr("x1", m[1])
    .attr("y1", function(d) {return y1(d.lane);})
    .attr("x2", w)
    .attr("y2", function(d) {return y1(d.lane);})
    .attr("stroke", "lightgray")

  main.append("g").selectAll(".laneText")
    .data(lanes)
    .enter().append("text")
    .text(function(d) {return d;})
    .attr("x", -m[1])
    .attr("y", function(d, i) {return y1(i + .5);})
    .attr("dy", ".5ex")
    .attr("text-anchor", "end")
    .attr("class", "laneText");*/
  
  //mini lanes and texts
  mini.append("g").selectAll(".laneLines")
    .data(items)
    .enter().append("line")
    .attr("x1", m[1])
    .attr("y1", function(d) {return y2(d.lane);})
    .attr("x2", w)
    .attr("y2", function(d) {return y2(d.lane);})
    .attr("stroke", "lightgray");

  mini.append("g").selectAll(".laneText")
    .data(lanes)
    .enter().append("text")
    .text(function(d) {return d;})
    .attr("x", -m[1])
    .attr("y", function(d, i) {return y2(i + .5);})
    .attr("dy", ".5ex")
    .attr("text-anchor", "end")
    .attr("class", "laneText");

  /*var itemRects = main.append("g")
            .attr("clip-path", "url(#clip)");*/
  
  //mini item rects
  mini.append("g").selectAll("miniItems")
    .data(items)
    .enter().append("rect")
    .attr("class", function(d) {return "miniItem" + d.lane;})
    .attr("x", function(d) {return x(d.start);})
    .attr("y", function(d) {return y2(d.lane + .5) - 5;})
    .attr("width", function(d) {return x(d.end - d.start);})
    .attr("height", 10);

  //mini labels
  mini.append("g").selectAll(".miniLabels")
    .data(items)
    .enter().append("text")
    .text(function(d) {return d.id;})
    .attr("x", function(d) {return x(d.start);})
    .attr("y", function(d) {return y2(d.lane + .5);})
    .attr("dy", ".5ex");

  //brush
  var brush = d3.svg.brush()
            .x(x)
            .on("brush", display);

  mini.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", 1)
    .attr("height", miniHeight - 1);

  display();
  
  function display() {
    var rects, labels,
      minExtent = brush.extent()[0],
      maxExtent = brush.extent()[1],
      visItems = items.filter(function(d) {return d.start < maxExtent && d.end > minExtent;});

    mini.select(".brush")
      .call(brush.extent([minExtent, maxExtent]));

    x1.domain([minExtent, maxExtent]);

    /*//update main item rects
    rects = itemRects.selectAll("rect")
            .data(visItems, function(d) { return d.id; })
      .attr("x", function(d) {return x1(d.start);})
      .attr("width", function(d) {return x1(d.end) - x1(d.start);});
    
    rects.enter().append("rect")
      .attr("class", function(d) {return "miniItem" + d.lane;})
      .attr("x", function(d) {return x1(d.start);})
      .attr("y", function(d) {return y1(d.lane) + 10;})
      .attr("width", function(d) {return x1(d.end) - x1(d.start);})
      .attr("height", function(d) {return .8 * y1(1);});

    rects.exit().remove();

    //update the item labels
    labels = itemRects.selectAll("text")
      .data(visItems, function (d) { return d.id; })
      .attr("x", function(d) {return x1(Math.max(d.start, minExtent) + 2);});

    labels.enter().append("text")
      .text(function(d) {return d.id;})
      .attr("x", function(d) {return x1(Math.max(d.start, minExtent));})
      .attr("y", function(d) {return y1(d.lane + .5);})
      .attr("text-anchor", "start");

    labels.exit().remove();*/

  }
}