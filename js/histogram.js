class Histogram {
    constructor(onChangeSelectionMethod) {
        this.bins = [];
        this.chart = null;
        this.binAmount = 100;
        this.barWidth = 3;
        this.onChangeSelectionMethod = onChangeSelectionMethod;

        this.axisOffset = 5;
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
            this.setupChart();
        else
            this.updateChart();
    }

    setupChart() {
        let axisLength = this.getAxisLength();

        // add y axis
        let yAxisScale = d3.scaleLinear().domain([0, 1]).range([axisLength, 0]);
        let yAxis = d3.axisLeft(yAxisScale).ticks(10);
        d3.select(".histogram .y-axis")
            .call(yAxis)
            .attr("transform", "translate("
                + this.axisWidth
                + ","
                + this.axisOffset
                + ")");

        // add x axis
        let xAxisScale = d3.scaleLinear().domain([0, 1]).range([0, axisLength]);
        let xAxis = d3.axisBottom(xAxisScale).ticks(10);
        d3.select(".histogram .x-axis")
            .call(xAxis)
            .attr("transform", "translate("
                + (this.axisWidth)
                + ","
                + (axisLength + this.axisOffset)
                + ")");

        // add bars
        let getBarHeight = this.getBinScalerFunction();
        this.chart = d3.select(".histogram .bins")
            .attr("transform", "translate("
                + (this.axisOffset + this.axisWidth)
                + ","
                + (axisLength + this.axisOffset)
                + ")")
            .selectAll("rect")
            .data(this.bins)
            .join("rect")
            .attr("height", function (value) {
                if (value.length === 0)
                    return 0;
                return getBarHeight(value.length) + "px";
            })
            .attr("width", this.barWidth + "px")
            .attr("transform", function (d, i) {
                return "translate(" + i * 4 + ", 0)";
            });

        // add clickable area
        d3.select(".interaction-area")
            .attr("transform", "translate("
                + (this.axisOffset + this.axisWidth)
                + ","
                + 0
                + ")")
            .append("rect")
            .style("fill", "transparent")
            .attr("height", axisLength)
            .attr("width", axisLength)
            .on('click', this.onClick);

        // adjust viewBox to fit everything
    }

    updateChart() {
        let getBarHeight = this.getBinScalerFunction();
        this.chart.data(this.bins)
            .transition(5000)
            .attr("height", function (value) {
                if (value.length === 0)
                    return 0;
                return getBarHeight(value.length) + "px";
            })
    }

    onClick(clickEvent) {
        let svgPosition = this.getBoundingClientRect();
        let x = Math.abs(svgPosition.x - clickEvent.x) / svgPosition.width;
        let y = 1 - Math.abs(svgPosition.y - clickEvent.y) / svgPosition.height;
        histogram.onChangeSelectionMethod(x);
    }

    getBinScalerFunction() {
        let binMaxValue = this.sizeOfBiggestBin(this.bins);
        return d3.scaleLog().domain([1, binMaxValue]).range([0, histogram.maxBarHeight]);
    }

    getAxisLength() {
        return this.bins.length * 4;
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