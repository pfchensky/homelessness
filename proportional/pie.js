export function drawPieCharts(stateData) {
  //clear the previous value
  d3.select("#pie_charts").html("");
  
  //set up the svg container
  const svgWidth = 700;
  const svgHeight = 700;

  const svg = d3.select("#pie_charts")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  
  // add the chosen state name as title
  svg.append("text")
    .attr("x", svgWidth / 2 -50)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "28px")
    .attr("font-weight", "bold")
    .text(stateData.state);

  //Define a color scale for d3-svg-legend
  const colorScale = d3.scaleOrdinal()
    .domain(["Selected Category", "Other"])
    .range(["blue", "#deebf7"]);
  
  // Add d3-svg-legend
  const legend = d3.legendColor()
    .scale(colorScale)
    .shape("rect")
    .shapeWidth(14)
    .shapeHeight(14)
    .title("Category");

  svg.append("g")
    .attr("class", "pieLegend")
    .attr("transform", "translate(20, 20)");

  svg.select(".pieLegend")
    .call(legend)
    .select(".legendTitle")
    .attr("y", 8)
    .style("font-size", "14px");

  svg.select(".pieLegend")
    .selectAll("text")
    .style("font-size", "14px");
  
  // four pie chart data
  const pieDataList = [
    {
      title: "Chronic Homelessness",
      value: stateData.chronic_pct,
      mainLabel: "Chronic",
      otherLabel: "Other"
    },
    {
      title: "Unaccompanied Youth",
      value: stateData.youth_pct,
      mainLabel: "Youth",
      otherLabel: "Other"
    },
    {
      title: "Veterans",
      value: stateData.veterans_pct,
      mainLabel: "Veterans",
      otherLabel: "Other"
    },
    {
      title: "Unsheltered",
      value: stateData.unsheltered_pct,
      mainLabel: "Unsheltered",
      otherLabel: "Other"
    }
  ];
  
  //four pie chart position
  const piePositions = [
    { x: 180, y: 190 },
    { x: 420, y: 190 },
    { x: 180, y: 450 },
    { x: 420, y: 450 }
  ];
  
  // loop each data value to draw four pie chart 
  pieDataList.forEach(function(chartInfo, i) {
    drawOnePieChart(svg, chartInfo, piePositions[i].x, piePositions[i].y);
  });
}


function drawOnePieChart(svg, chartInfo, centerX, centerY) {
  
  //define piechart radius
  const radius = 80;

  const chart = svg.append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  const pieData = [
    { label: chartInfo.mainLabel, value: chartInfo.value },
    { label: chartInfo.otherLabel, value: 100 - chartInfo.value }
  ];
  
  // pie chart colour scale
  const colorScale = d3.scaleOrdinal()
    .domain([chartInfo.mainLabel, "Other"])
    .range(["blue", "#deebf7"]);

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const labelArc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.6);

  chart.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => colorScale(d.data.label))
    .attr("stroke", "white")
    .attr("stroke-width", 1);
   
  chart.selectAll("text")
    .data(pie(pieData))
    .enter()
    .append("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "bold")
    .attr("fill", d => d.data.label === "Other" ? "black" : "white")
    .text(d => d.data.value+"%");

  svg.append("text")
    .attr("x", centerX)
    .attr("y", centerY + radius + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(chartInfo.title);
}