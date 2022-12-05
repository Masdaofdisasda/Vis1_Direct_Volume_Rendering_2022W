class Histogram {
    constructor() {
        this.bins = [];
        this.chart = null;
        this.binAmount = 100;
    }

    update(densityArray) {
        this.bins = d3.bin().thresholds(this.binAmount)(densityArray);

        if (this.chart === null)
            this.setupChart();
        else
            this.updateChart();
    }

    setupChart() {
        // let svg = d3.select('#tfContainer')
        //     .append('svg')
        //     .attr('width', "100%")
        //     .attr('height', 150);

        // let yScale = d3.scaleLinear().domain([0, 100]).range([0, 150]);
        // let yAxis = d3.axisLeft(yScale).ticks(10);

        // svg.append("g")
        //     .attr("class", "axis")
        //     .call(yAxis)
        //     .append("text")
        //     .style("text-anchor", "middle")
        //     .text("domain name");

        let binScalerFunction = this.getBinScalerFunction();
        this.chart = d3.select(".histogram")
            .selectAll("div")
            .data(this.bins)
            .join("div")
            .style("height", function (value) { return binScalerFunction(value.length) + "px"; });
    }

    updateChart() {
        let binScale = this.getBinScalerFunction();
        this.chart.data(this.bins)
            .transition(5000)
            .style("height", function (value) { return binScale(value.length) + "px"; });
    }

    getBinScalerFunction() {
        let binMaxValue = this.sizeOfBiggestBin(this.bins);
        return d3.scaleLinear().domain([0, binMaxValue]).range([0, 200]);
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