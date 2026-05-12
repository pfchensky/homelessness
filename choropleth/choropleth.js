import { drawPieCharts } from "./pie.js";
import { highlightStateInPCP } from "../parallel/parallel.js";
//set up the svg container
const svgWidth=960;
const svgHeight=600;
const margin={top:70,right:40,bottom:70,left:40};

const width=svgWidth-margin.left-margin.right;
const height=svgHeight-margin.top-margin.bottom;

const svg=d3.select("#choropleth_map")
  .append("svg")
  .attr("width",svgWidth)
  .attr("height",svgHeight)

const chart=svg.append("g")
  .attr("transform",`translate(${margin.left},${margin.top})`);

// Chart title
svg.append("text")
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("x", svgWidth/2)
    .attr("y",30)
    .text("Homeless Population Distribution in the United States, 2013");

//read data 
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.csv("2013_US_state_stat_pro.csv")
]).then(function([us, data]){
  
  //convert string to numeric
  data.forEach(function(d){
    d.total_homeless_persons = +d.total_homeless_persons;
    d.chronic_pct = +d.chronic_pct;
    d.youth_pct = +d.youth_pct;
    d.veterans_pct = +d.veterans_pct;
    d.unsheltered_pct = +d.unsheltered_pct;
  });

  //create a map, state : total_homeless_persons
  const homelessMap = new Map(
    data.map(d => [d.state, d.total_homeless_persons])
  );

  const stateDataMap = new Map(
    data.map(d => [d.state, d])
  );

  // convert topojson to geojson
  let states = topojson.feature(us, us.objects.states).features;

  // filter 50 states in my csv
  states = states.filter(d => homelessMap.has(d.properties.name));
  
  // projection
  const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2 + 20])
    .scale(1100);
  
  // path
  const path = d3.geoPath().projection(projection);

  // get min and max value
  const minValue = d3.min(data, d => d.total_homeless_persons);
  const maxValue = d3.max(data, d => d.total_homeless_persons);
  
  //define color scales
  const sequentialScale=d3.scaleSequential()
    .domain([minValue, maxValue])
    .interpolator(d3.interpolateBlues);

  //define a tooltip 
  const tooltip=d3.select("#tooltip")
  let selectedMapState = null;

  // draw choropleth
  const statePaths = chart.selectAll(".state")
    .data(states)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", d => sequentialScale(homelessMap.get(d.properties.name)))
    .attr("stroke", "white")
    .attr("stroke-width", 0.8)
    .on("click", (event, d) => {
      const stateName = d.properties.name;
      selectedMapState = stateName;

      // update map color
      statePaths
        .attr("fill", s => {
          if (s.properties.name === selectedMapState) {
            return "orange";
          }
          return sequentialScale(homelessMap.get(s.properties.name));
        })
        .attr("stroke", "white")
        .attr("stroke-width",0.8);

      // update pie chart 
      drawPieCharts(stateDataMap.get(stateName));

      // highlight same state in parallel coordinate plot
      highlightStateInPCP(stateName);
    })
    .on("dblclick", (event, d) => {
      event.stopPropagation();
      resetMapSelection();
    })
    .on("mouseover", (event, d) =>{
      tooltip
        .html(`
          State: <strong>${d.properties.name}</strong><br>
          Total Homeless Persons : <strong>${d3.format(",")(homelessMap.get(d.properties.name))}</strong><br>
        `)
        .style("opacity", 1)
    })
    .on("mousemove", (event)=> {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", ()=> {
      tooltip.style("opacity", 0);
    });
  
  function resetMapSelection() {
    selectedMapState = null;

    statePaths
      .attr("fill", s => sequentialScale(homelessMap.get(s.properties.name)))
      .attr("stroke", "white")
      .attr("stroke-width", 0.8);

    highlightStateInPCP(null);
    drawPieCharts(data[0]);
  }

  svg.on("dblclick", function() {
    resetMapSelection();
  });
  
  // state borders
  chart.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", path);

  //Add d3-svg-legend
  const legend = d3.legendColor()
    .scale(sequentialScale)
    .shapeWidth(30)
    .shapeHeight(18)
    .shapePadding(6)
    .orient("vertical")
    .labelFormat(d3.format(".0f"))
    .title("Homeless Counts");

  svg.append("g")
    .attr("class", "legendSequential")
    .attr("transform", `translate(${svgWidth - 150}, 400)`)
  
  svg.select(".legendSequential")
    .call(legend)
  
  svg.select(".legendSequential")
  .selectAll(".label")
  .text(function() {
    const value = +d3.select(this).text();
    return d3.format(".0f")(value / 1000) + "k";
  });
  
  svg.select(".legendSequential")
    .select(".legendTitle")
    .attr("y",12)
    .style("font-size","14px")
    
  svg.select(".legendSequential")
    .selectAll("text")
    .style("font-size","14px");

  // default pie charts
  drawPieCharts(data[0]);
})

