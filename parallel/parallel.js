//set up the svg container
const svgWidth=700;
const svgHeight=450;
const margin={top:60,right:40,bottom:60,left:80};

const width=svgWidth-margin.left-margin.right;
const height=svgHeight-margin.top-margin.bottom;

const svg=d3.select("#parallel_coordinate")
  .append("svg")
  .attr("width",svgWidth)
  .attr("height",svgHeight)

const chart=svg.append("g")
  .attr("transform",`translate(${margin.left},${margin.top})`);

// Chart title
svg.append("text")
  .attr("font-size", "18px")
  .attr("text-anchor", "middle")
  .attr("font-weight","bold")
  .attr("x", svgWidth/2+10)
  .attr("y",20)
  .text("USA Homelessness Different Categories Distribution");

//read data and convert string to numeric
d3.csv("2013_US_state_stat_pro.csv").then(function(data){
  data.forEach(function(d){
    d.total_homeless_persons = +d.total_homeless_persons;
    d.homeless_rate = +d.homeless_rate;
    d.chronic_pct = +d.chronic_pct;
    d.youth_pct = +d.youth_pct;
    d.veterans_pct = +d.veterans_pct;
    d.unsheltered_pct = +d.unsheltered_pct;
  })
  
  const dimensions = [
    "total_homeless_persons",
    "homeless_rate",
    "chronic_pct",
    "youth_pct",
    "veterans_pct",
    "unsheltered_pct"
  ];
  
  const dimensionLabels = {
    total_homeless_persons: "Total Homeless",
    homeless_rate: "Rate",
    chronic_pct: "Chronic %",
    youth_pct: "Youth %",
    veterans_pct: "Veterans %",
    unsheltered_pct: "Unsheltered %"
  };

  // Define X and Y scales
  const scaleX = d3.scalePoint()
    .domain(dimensions)
    .range([0, width])
    .padding(0.5);

  const scaleY = {};

  dimensions.forEach(function(dim) {
    scaleY[dim] = d3.scaleLinear()
      .domain(d3.extent(data, d => d[dim]))
      .nice()
      .range([height, 0]);
  });

  // line
  function path(d) {
    return d3.line()(
      dimensions.map(function(dim) {
        return [scaleX(dim), scaleY[dim](d[dim])];
      })
    );
  }

  //define a tooltip 
  const tooltip=d3.select("#tooltip")

  chart.selectAll(".line")
    .data(data)
    .enter()
    .append("path")
    .attr("class","line")
    .attr("d",path)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.6)
    .on("mouseover", (event, d) =>{
      tooltip
        .html(`
          <strong>State: ${d.state}</strong><br>
          Total homeless persons: ${d3.format(",")(d.total_homeless_persons)}<br>
          Homeless rate: ${d.homeless_rate}<br>
          Chronic: ${d.chronic_pct}%<br>
          Youth: ${d.youth_pct}%<br>
          Veterans: ${d.veterans_pct}%<br>
          Unsheltered: ${d.unsheltered_pct}%
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
  
  // Add axes
  dimensions.forEach(function(dim) {
    const dimensionAxis = chart.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${scaleX(dim)},0)`)
      .call(d3.axisLeft(scaleY[dim]));

    dimensionAxis.append("text")
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .text(dimensionLabels[dim]);
  });
})