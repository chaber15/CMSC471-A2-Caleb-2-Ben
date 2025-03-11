document.addEventListener("DOMContentLoaded", function () {
  const margin = { top: 60, right: 10, bottom: 30, left: 60 }; // Increased left margin
  const width = 1000 - margin.left - margin.right; // Adjust width for the graph
  const height = 800 - margin.top - margin.bottom;

  const monthMap = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  };

  const svg = d3
    .select("#vis")
    .append("svg")
    .attr("viewBox", [0, 0, width + margin.left, height]) // Adjusted for new margin
    .attr("width", width + margin.left)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  let data;

  function init() {
    d3.csv("data/aggregated_crime_data_monthly.csv")
      .then((loadedData) => {
        const parseDate = d3.timeParse("%Y-%m");

        // Clean and format the data
        loadedData.forEach((d) => {
          d.date = parseDate(d.YearMonth);
          d.count = +d.Count;
        });

        data = loadedData;

        console.log(data);
        updateYear(2024);
      })
      .catch((error) => console.error("Error loading data:", error));
  }

  function updateYear(year, showAllYears) {
    if (showAllYears) {
      drawStreamGraph(data);
      document.getElementById("yearLabel").textContent = "2014 - 2024";
    } else {
      const filteredData = data.filter(
        (d) => d.date.getFullYear() === parseInt(year)
      );
      drawStreamGraph(filteredData);
      document.getElementById("yearLabel").textContent = year;
    }
  }

  function toggleAllYears() {
    const checkbox = document.getElementById("toggleYearsCheckbox");
    if (checkbox.checked) {
      updateYear(2024, true);
    } else {
      const year = document.getElementById("yearSlider").value;
      updateYear(year, false);
    }
  }
  function drawStreamGraph(data) {
    svg.selectAll("*").remove(); // Clear the previous graph

    const crimeTypes = [
      "ARSON",
      "ASSAULT",
      "BATTERY",
      "BURGLARY",
      "HOMICIDE",
      "NARCOTICS",
      "OTHER",
      "ROBBERY",
      "THEFT",
      "TRESPASSING",
      "VANDALISM",
      "VEHICLE_THEFT",
    ]; // Explicitly define your crime types here

    const series = d3
      .stack()
      .offset(d3.stackOffsetNone) // stacked area chart
      .offset(d3.stackOffsetWiggle) // stream graph
      .order(d3.stackOrderInsideOut)
      .keys(crimeTypes)
      .keys(d3.union(data.map((d) => d["Primary Type"]))) // Unique crime types
      .value(([, D], key) => D.get(key)?.count || 0)(
      d3.index(
        data,
        (d) => d.date,
        (d) => d["Primary Type"]
      )
    );

    // Scales
    const x = d3
      .scaleUtc()
      .domain(d3.extent(data, (d) => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(series.flat(2)))
      .rangeRound([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal()
      .domain(series.map((d) => d.key))
      .range(d3.schemeSet2);

    // Area generator
    const area = d3
      .area()
      .x((d) => x(d.data[0]))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    // Add the stacked areas
    const paths = svg
      .append("g")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", (d) => color(d.key))
      .attr("d", area)
      .attr("class", (d) => `crime-type ${d.key}`) // Add a class for each crime type
      .on("mouseover", function (event, d) {
        const [mouseX] = d3.pointer(event);
        const hoveredDate = x.invert(mouseX);
        const monthData = data.find(
          (item) =>
            item.date.getFullYear() === hoveredDate.getFullYear() &&
            item.date.getMonth() === hoveredDate.getMonth() &&
            item["Primary Type"] === d.key
        );
        const crimeCount = monthData ? monthData.count : 0;
        d3
          .select("#tooltip")
          .style(
            "opacity",
            1
          ).html(`Crime Type: ${d.key}<br>Count: ${crimeCount} 
            <br>Year:${hoveredDate.getFullYear()}
            <br>Month:${monthMap[hoveredDate.getMonth()]}`);
      })

      .on("mousemove", function (event, d) {
        const [mouseX] = d3.pointer(event);
        const hoveredDate = x.invert(mouseX);
        const monthData = data.find(
          (item) =>
            item.date.getFullYear() === hoveredDate.getFullYear() &&
            item.date.getMonth() === hoveredDate.getMonth() &&
            item["Primary Type"] === d.key
        );
        const crimeCount = monthData ? monthData.count : 0;
        d3
          .select("#tooltip")
          .style("opacity", 1)
          .style("left", event.pageX + 10 + "px")
          .style(
            "top",
            event.pageY - 10 + "px"
          ).html(`Crime Type: ${d.key}<br>Count: ${crimeCount} 
            <br>Year:${hoveredDate.getFullYear()}
            <br>Month:${monthMap[hoveredDate.getMonth()]}`);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("opacity", 0);
      });

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call((g) => g.select(".domain").remove());

    // Add y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(height / 80)
          .tickFormat((d) => Math.abs(d).toLocaleString("en-US"))
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Crime count")
      );

    const months = d3.timeMonths(
      d3.min(data, (d) => d.date),
      d3.max(data, (d) => d.date)
    );
    svg
      .append("g")
      .selectAll("line")
      .data(months)
      .enter()
      .append("line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr(
        "stroke",
        document.getElementById("toggleYearsCheckbox").checked ? "None" : "#555"
      )
      .attr("stroke-width", 1);

    // Add the legend to the top of the graph, horizontally
    const legend = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top - 30})`);

    // Create a legend group for each crime type
    const legendItem = legend
      .selectAll(".legend-item")
      .data(series)
      .join("g")
      .attr("class", "legend-item");

    // Append the legend rectangle (smaller square size)
    legendItem
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d) => color(d.key))
      .style("stroke", "none") // Initial border is none
      .style("cursor", "pointer"); // Add pointer cursor for interaction

    // Append the legend text with smaller font size
    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("fill", "currentColor")
      .style("font-size", "10px")
      .text((d) => d.key);

    // Calculate spacing dynamically after rendering
    let cumulativeWidth = 0;
    legendItem.each(function (d, i) {
      const textWidth = d3.select(this).select("text").node().getBBox().width;
      d3.select(this).attr("transform", `translate(${cumulativeWidth}, 0)`);
      cumulativeWidth += textWidth + 25; // Add padding
    });

    // Interactive Legend: Toggle visibility of the areas and change styles (border and background)
    legendItem.on("click", function (event, d) {
      // Toggle the class for the clicked legend
      const isVisible =
        svg.selectAll(`.crime-type.${d.key}`).style("opacity") === "0";
      svg
        .selectAll(`.crime-type.${d.key}`)
        .transition()
        .style("opacity", isVisible ? 1 : 0);

      // Change background and border of the legend item on click
      const rect = d3.select(this).select("rect");
      if (isVisible) {
        rect
          .style("fill", color(d.key)) // Revert to the original color
          .style("stroke", "none"); // Remove the border
      } else {
        rect
          .style("fill", "white") // Set background to white
          .style("stroke", "black") // Add a black border
          .style("stroke-width", "1px"); // Set the border width
      }
    });
  }

  window.addEventListener("load", init);
  window.updateYear = updateYear; // Make updateYear function globally accessible
  window.toggleAllYears = toggleAllYears; // Make toggleAllYears function globally accessible
});
