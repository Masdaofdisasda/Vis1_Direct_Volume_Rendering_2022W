class Histogram {
    constructor() {
        this.bins = [];
        this.chart = null;
        this.binAmount = 100;
    }

    update(densityArray) {
        this.bins = d3.bin().thresholds(this.binAmount)(densityArray);

        if (this.chart === null) {
            this.setupChart();
            return;
        }

        this.updateChart();
    }

    setupChart() {
        let svg = d3.select('#tfContainer')
            .append('svg')
            .attr('width', "100%")
            .attr('height', 150);

        let yScale = d3.scaleLinear().domain([0, 100]).range([0, 150]);
        let yAxis = d3.axisLeft(yScale).ticks(10);

        svg.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .style("text-anchor", "middle")
            .text("domain name");

        let binScale = this.getBinScale();
        this.chart = d3.select("#tfContainer")
            .append('div')
            .classed('histogram', true)
            .selectAll("div")
            .data(this.bins)
            .join("div")
            .style("height", function (value) { return binScale(value.length) + "px"; });
    }

    updateChart() {
        let binScale = this.getBinScale();
        this.chart.data(this.bins)
            .transition(5000)
            .style("height", function (value) { return binScale(value.length) + "px"; });
    }

    getBinScale() {
        let binMaxValue = this.sizeOfBiggestBin(this.bins);
        return d3.scaleLinear().domain([0, binMaxValue]).range([0, 200]);
    }

    // exists, because "max" function does not work for some reason
    sizeOfBiggestBin(arr) {
        let biggestNumber = 0;
        arr.forEach(num => {
            if (num.length > biggestNumber)
                biggestNumber = num.length;
        })
        return biggestNumber;
    }
}