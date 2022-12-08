class Histogram {
    constructor(onChangeSelectionMethod, startDensity) {
        this.bins = [];
        this.chart = null;
        this.onChangeSelectionMethod = onChangeSelectionMethod;
        this.binScalerFunction;
        this.axisLength;
        this.startDensity = startDensity;

        // Settings
        this.binAmount = 100;
        this.barWidth = 2; //how much bigger than the spaces
        this.spacesBetweenBars = .5;
        this.axisOffset = 20;
        this.axisWidth = 30;
        this.maxBarHeight = 200;
    }

    update(densityArray) {
        let histogram = d3.histogram()
            .value(function (d) { return d; })
            .domain([0, 1])
            .thresholds(this.binAmount);
        this.bins = histogram(densityArray);

        if (this.chart === null)
            this.setup();
        else
            this.updateChart();
    }

    setup() {
        // calculate dynamic settings
        this.axisLength = this.binAmount * (this.barWidth + this.spacesBetweenBars);
        let binMaxValue = this.sizeOfBiggestBin(this.bins);
        this.binScalerFunction = d3.scaleLog().domain([1, binMaxValue]).range([0, histogram.maxBarHeight]);

        // set viewbox
        d3.select(".histogram")
            .attr("viewBox", "0 0 "
                + this.getChartWidth()
                + " "
                + this.getChartHeight());

        // add y axis
        let yAxisScale = d3.scaleLinear().domain([0, 1]).range([this.axisLength, 0]);
        let yAxisGenerator = d3.axisLeft(yAxisScale).ticks(10);
        let yAxis = d3.select(".histogram .y-axis")
            .call(yAxisGenerator)
            .attr("transform", "translate("
                + this.axisWidth
                + ","
                + this.axisOffset
                + ")");

        yAxis.append("text")
            .attr("text-anchor", "end")
            .attr("x", this.axisWidth / 2)
            .attr("y", -this.axisOffset / 2)
            .text("Intensity")
            .attr("fill", "white");

        // add x axis
        let xAxisScale = d3.scaleLinear().domain([0, 1]).range([0, this.axisLength]);
        let xAxisGenerator = d3.axisBottom(xAxisScale).ticks(10);
        let xAxis = d3.select(".histogram .x-axis")
            .call(xAxisGenerator)
            .attr("transform", "translate("
                + (this.axisWidth)
                + ","
                + (this.axisLength + this.axisOffset)
                + ")");
        xAxis.append("text")
            .attr("text-anchor", "end")
            .attr("x", this.axisLength)
            .attr("y", this.axisWidth)
            .text("Density")
            .attr("fill", "white");

        // add bars
        this.chart = d3.select(".histogram .bins")
            .attr("transform", "translate("
                + (this.axisWidth)
                + ","
                + (this.axisLength + this.axisOffset)
                + ")")
            .selectAll("rect")
            .data(this.bins)
            .join("rect")
            .attr("height", function (value) {
                if (value.length === 0)
                    return 0;
                return histogram.binScalerFunction(value.length) + "px";
            })
            .attr("width", this.barWidth + "px")
            .attr("transform", function (d, i) {
                return "translate("
                    + i * (histogram.barWidth + histogram.spacesBetweenBars)
                    + ", 0)";
            });

        // add clickable area
        let interactionArea = d3.select(".interaction-area")
            .attr("transform", "translate("
                + (this.axisWidth)
                + ","
                + this.axisOffset
                + ")")
            .append("rect")
            .style("fill", "transparent")
            .attr("height", this.axisLength)
            .attr("width", this.axisLength)
            .on('click', this.onClickChart);

        // Update selection marker
        let n = d3.select(".interaction-area").node()
        let startPosX = n.getBoundingClientRect().width * this.startDensity;
        histogram.updateSelectionMarker(startPosX, 1);
    }

    updateChart() {
        this.chart.data(this.bins)
            .transition(5000)
            .attr("height", function (value) {
                if (value.length === 0)
                    return 0;
                return histogram.binScalerFunction(value.length) + "px";
            })
    }

    onClickChart(clickEvent) {
        let svgPosition = this.getBoundingClientRect();
        let x = Math.abs(svgPosition.x - clickEvent.x) / svgPosition.width;
        let y = 1 - Math.abs(svgPosition.y - clickEvent.y) / svgPosition.height;

        histogram.onChangeSelectionMethod(x);

        let xShrinkFactor = histogram.axisLength / svgPosition.width;
        let yShrinkFactor = histogram.axisLength / svgPosition.height;
        let markerX = Math.abs(svgPosition.x - clickEvent.x) * xShrinkFactor;
        let markerY = Math.abs(svgPosition.y - clickEvent.y) * yShrinkFactor;
        histogram.updateSelectionMarker(markerX, markerY);
    }

    updateSelectionMarker(x, y) {
        d3.select(".selection-marker circle")
            .attr("cx", x)
            .attr("cy", y)
            .style("fill", "white");

        d3.select(".selection-marker line")
            .attr("x1", x)
            .attr("y1", y)
            .attr("x2", x)
            .attr("y2", histogram.axisLength)
            .style("stroke", "white");
    }

    getChartHeight() {
        let h = histogram;
        return h.axisOffset
            + h.axisLength
            + h.axisWidth
            + h.maxBarHeight;
    }

    getChartWidth() {
        let h = histogram;
        return h.axisWidth + h.axisLength + h.axisOffset;
    }

    /**
     * Exists, because "max" function does not work for some reason
     */
    sizeOfBiggestBin(bins) {
        let biggestNumber = 0;
        bins.forEach(num => {
            if (num.length > biggestNumber)
                biggestNumber = num.length;
        })
        return biggestNumber;
    }
}