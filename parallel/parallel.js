// set up the svg container
const svgWidth = 1100;
const svgHeight = 650;
const margin = { top: 100, right: 130, bottom: 80, left: 90 };

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

let mapSelectedState = null;
let updatePCPLines = null;

const svg = d3.select("#parallel_coordinate")
  .append("svg")
  .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
  .attr("preserveAspectRatio", "xMinYMin meet")
  .style("width", "100%")
  .style("height", "auto")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Chart title
svg.append("text")
  .attr("font-size", "18px")
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("x", svgWidth / 2 + 10)
  .attr("y", 22)
  .text("Homelessness Different Categories Distribution");

// instruction text
svg.append("text")
  .attr("font-size", "12px")
  .attr("text-anchor", "middle")
  .attr("x", svgWidth / 2 + 10)
  .attr("y", 43)
  .attr("fill", "#555")
  .text("Drag a rectangle over state lines to filter. Double-click to reset.");

const countText = svg.append("text")
  .attr("font-size", "12px")
  .attr("text-anchor", "middle")
  .attr("x", svgWidth / 2 + 10)
  .attr("y", 60)
  .attr("fill", "#555");

// read data and convert string to numeric
d3.csv("2013_US_state_stat_pro.csv").then(function(data) {

  data.forEach(function(d) {
    d.total_homeless_persons = +d.total_homeless_persons;
    d.homeless_rate = +d.homeless_rate;
    d.chronic_pct = +d.chronic_pct;
    d.youth_pct = +d.youth_pct;
    d.veterans_pct = +d.veterans_pct;
    d.unsheltered_pct = +d.unsheltered_pct;
  });

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
    homeless_rate: "Rate per 10,000",
    chronic_pct: "Chronic %",
    youth_pct: "Unaccompanied Youth %",
    veterans_pct: "Veterans %",
    unsheltered_pct: "Unsheltered %"
  };

  // X scale
  const scaleX = d3.scalePoint()
    .domain(dimensions)
    .range([0, width])
    .padding(0.5);

  // Y scales
  const scaleY = {};

  dimensions.forEach(function(dim) {
    scaleY[dim] = d3.scaleLinear()
      .domain(d3.extent(data, d => d[dim]))
      .nice()
      .range([height, 0]);
  });

  // get all points for one state line
  function getPoints(d) {
    return dimensions.map(function(dim) {
      return [scaleX(dim), scaleY[dim](d[dim])];
    });
  }

  // line 
  function path(d) {
    return d3.line()(getPoints(d));
  }

  // define a tooltip
  const tooltip = d3.select("#tooltip");

  let selectedStates = new Set();
  let brushActive = false;
  let clearingBrushBox = false;

  // normalize brush rectangle
  function getBrushBox(selection) {
    const x0 = selection[0][0];
    const y0 = selection[0][1];
    const x1 = selection[1][0];
    const y1 = selection[1][1];

    return {
      left: Math.min(x0, x1),
      right: Math.max(x0, x1),
      top: Math.min(y0, y1),
      bottom: Math.max(y0, y1)
    };
  }

  // check if a point is inside brush rectangle
  function pointInsideBox(point, box) {
    const x = point[0];
    const y = point[1];

    return x >= box.left &&
           x <= box.right &&
           y >= box.top &&
           y <= box.bottom;
  }

  // orientation helper
  function orientation(a, b, c) {
    const value =
      (b[1] - a[1]) * (c[0] - b[0]) -
      (b[0] - a[0]) * (c[1] - b[1]);

    if (Math.abs(value) < 1e-9) {
      return 0;
    }

    return value > 0 ? 1 : 2;
  }

  // check if point b is on segment ac
  function onSegment(a, b, c) {
    return b[0] <= Math.max(a[0], c[0]) &&
           b[0] >= Math.min(a[0], c[0]) &&
           b[1] <= Math.max(a[1], c[1]) &&
           b[1] >= Math.min(a[1], c[1]);
  }

  // check if two line segments intersect
  function segmentsIntersect(p1, p2, p3, p4) {
    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);

    if (o1 !== o2 && o3 !== o4) {
      return true;
    }

    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;

    return false;
  }

  // check if one line segment passes through brush rectangle
  function segmentIntersectsBox(p1, p2, box) {
    if (pointInsideBox(p1, box) || pointInsideBox(p2, box)) {
      return true;
    }

    const segmentLeft = Math.min(p1[0], p2[0]);
    const segmentRight = Math.max(p1[0], p2[0]);
    const segmentTop = Math.min(p1[1], p2[1]);
    const segmentBottom = Math.max(p1[1], p2[1]);

    if (
      segmentRight < box.left ||
      segmentLeft > box.right ||
      segmentBottom < box.top ||
      segmentTop > box.bottom
    ) {
      return false;
    }

    // rectangle edges
    const topLeft = [box.left, box.top];
    const topRight = [box.right, box.top];
    const bottomLeft = [box.left, box.bottom];
    const bottomRight = [box.right, box.bottom];

    return segmentsIntersect(p1, p2, topLeft, topRight) ||
           segmentsIntersect(p1, p2, topRight, bottomRight) ||
           segmentsIntersect(p1, p2, bottomRight, bottomLeft) ||
           segmentsIntersect(p1, p2, bottomLeft, topLeft);
  }

  // check if the whole state line passes through brush rectangle
  function lineInsideBrush(d, selection) {
    const box = getBrushBox(selection);
    const points = getPoints(d);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (segmentIntersectsBox(p1, p2, box)) {
        return true;
      }
    }

    return false;
  }

  // draw lines
  const lines = chart.selectAll(".line")
    .data(data)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .style("stroke-width", 1.5)
    .style("opacity", 0.6)
    .on("mouseover", function(event, d) {
      if (brushActive && !selectedStates.has(d.state)) {
        return;
      }

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
        .style("opacity", 1);

      d3.select(this)
        .attr("stroke", "orange")
        .style("stroke-width", 3)
        .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", function() {
      tooltip.style("opacity", 0);
      updateLines();
    });

  // Add axes
  dimensions.forEach(function(dim) {
    const dimensionAxis = chart.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${scaleX(dim)},0)`);

    let axis = d3.axisLeft(scaleY[dim]);

    if (dim === "total_homeless_persons") {
      axis.tickFormat(d => d3.format(".0f")(d / 1000) + "k");
    }

    dimensionAxis.call(axis);

    dimensionAxis.append("text")
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .text(dimensionLabels[dim]);
  });

  // update line styles based on brush selection and map click
  function updateLines() {
  countText.text(
    brushActive
      ? `${selectedStates.size} state(s) selected`
      : `Showing all ${data.length} states`
  );

  lines
    .attr("stroke", function(d) {
      const isMapSelected = d.state === mapSelectedState;
      const isBrushSelected = selectedStates.has(d.state);

      // map clicked state
      if (isMapSelected) {
        return "orange";
      }

      // brush selected states
      if (brushActive && isBrushSelected) {
        return "blue";
      }

      return "blue";
    })
    .style("stroke-width", function(d) {
      const isMapSelected = d.state === mapSelectedState;
      const isBrushSelected = selectedStates.has(d.state);

      if (isMapSelected) {
        return 5;
      }

      if (brushActive && isBrushSelected) {
        return 3;
      }

      return 1.5;
    })
    .style("opacity", function(d) {
      const isMapSelected = d.state === mapSelectedState;
      const isBrushSelected = selectedStates.has(d.state);

      if (isMapSelected) {
        return 1;
      }

      if (mapSelectedState !== null) {
        return 0.12;
      }

      if (brushActive) {
        return isBrushSelected ? 1 : 0.04;
      }

      return 0.6;
    });
}

  updateLines();

  // Save this function so map.js can call it later
  updatePCPLines = updateLines;

  // state-line brush
  const stateBrush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("brush", function(event) {
      if (event.selection === null) {
        return;
      }

      brushActive = true;

      selectedStates = new Set(
        data
          .filter(d => lineInsideBrush(d, event.selection))
          .map(d => d.state)
      );

      updateLines();
    })
    .on("end", function(event) {
      if (clearingBrushBox) {
        clearingBrushBox = false;
        return;
      }

      if (event.selection === null) {
        return;
      }

      brushActive = true;

      selectedStates = new Set(
        data
          .filter(d => lineInsideBrush(d, event.selection))
          .map(d => d.state)
      );

      updateLines();

      // clear the brush rectangle after selection
      clearingBrushBox = true;
      brushGroup.call(stateBrush.move, null);
    });

  // Add brush group on top
  const brushGroup = chart.append("g")
    .attr("class", "state-brush")
    .call(stateBrush);
    
  brushGroup.lower();
  
  brushGroup.selectAll(".selection")
    .attr("fill", "orange")
    .attr("fill-opacity", 0.18)
    .attr("stroke", "orange")
    .attr("stroke-width", 1.5);

  brushGroup.selectAll(".overlay")
    .style("cursor", "crosshair");

  // double click to reset
  svg.on("dblclick", function() {
    brushActive = false;
    selectedStates.clear();

    mapSelectedState = null;

    clearingBrushBox = true;
    brushGroup.call(stateBrush.move, null);

    updateLines();
  });
});

export function highlightStateInPCP(stateName) {
  console.log("Map selected state:", stateName);

  mapSelectedState = stateName;

  if (updatePCPLines) {
    updatePCPLines();
  }
}