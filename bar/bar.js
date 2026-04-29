//set up the svg container
const svgWidth=820;
const svgHeight=500;
const margin={top:70,right:90,bottom:70,left:160};

const width=svgWidth-margin.left-margin.right;
const height=svgHeight-margin.top-margin.bottom;

const svg=d3.select("#bar_chart")
  .append("svg")
  .attr("width",svgWidth)
  .attr("height",svgHeight)

const chart=svg.append("g")
  .attr("transform",`translate(${margin.left},${margin.top})`);

//X-label
svg.append("text")
  .attr("class", "axis text")
  .attr("x", svgWidth/2)
  .attr("y", svgHeight-30)
  .text("Total Homeless People");

// Chart title
svg.append("text")
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("x", svgWidth/2)
    .attr("y",30)
    .text("Top 10 States by Total Homeless People(2013)");

//read data and convert string to numeric
d3.csv("2013_US_state_stat_pro.csv").then(function(data){
  data.forEach(function(d){
    d.total_homeless_persons=+d.total_homeless_persons
  })
  
  // sort data
  data.sort((a, b) => b.total_homeless_persons - a.total_homeless_persons);

  // get top 10 states
  const top10 = data.slice(0, 10);

  // Define X and Y scales
  const scaleX = d3.scaleLinear()
    .domain([0, 140000])
    .range([0, width]);

  const scaleY = d3.scaleBand()
  .domain(top10.map(d => d.state))
  .range([0, height])
  .padding(0.18);

  // Add bars
  chart.selectAll(".bar")
    .data(top10)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => scaleY(d.state))
    .attr("width", d => scaleX(d.total_homeless_persons))
    .attr("height",  scaleY.bandwidth());

  // Add data labels
  chart.selectAll(".bar-label")
    .data(top10)
    .enter()
    .append("text")
    .attr("x", d => scaleX(d.total_homeless_persons) + 25)
    .attr("y", d => scaleY(d.state) + scaleY.bandwidth() / 2)
    .attr("font-size","13px")
    .attr("text-anchor","middle")
    .text(d=>d.total_homeless_persons);
  
  // Add X and Y axes
  chart.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(scaleX).ticks(6));

  chart.append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(scaleY));
})