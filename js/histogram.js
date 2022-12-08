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
        this.barWidth = 3;
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
        this.axisLength = this.bins.length * 4;
        let binMaxValue = this.sizeOfBiggestBin(this.bins);
        this.binScalerFunction = d3.scaleLog().domain([1, binMaxValue]).range([0, histogram.maxBarHeight]);

        // add y axis
        let yAxisScale = d3.scaleLinear().domain([0, 1]).range([this.axisLength, 0]);
        let yAxis = d3.axisLeft(yAxisScale).ticks(10);
        d3.select(".histogram .y-axis")
            .call(yAxis)
            .attr("transform", "translate("
                + this.axisWidth
                + ","
                + this.axisOffset
                + ")");

        // add x axis
        let xAxisScale = d3.scaleLinear().domain([0, 1]).range([0, this.axisLength]);
        let xAxis = d3.axisBottom(xAxisScale).ticks(10);
        d3.select(".histogram .x-axis")
            .call(xAxis)
            .attr("transform", "translate("
                + (this.axisWidth)
                + ","
                + (this.axisLength + this.axisOffset)
                + ")");

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
                return "translate(" + i * 4 + ", 0)";
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

        let xShrinkFactor = histogram.axisLength/svgPosition.width;
        let yShrinkFactor = histogram.axisLength/svgPosition.height;
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