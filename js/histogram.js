class Histogram {
    constructor() {
        this.rawBins = [];
        this.scaledBins = [];
        this.chart = null;
    }

    update(volume) {
        this.setBins(volume);

        if (this.chart === null) {
            this.setupChart();
            return;
        }

        this.updateChart();
    }

    setBins(volume) {
        this.rawBins = this.divideIntoBins(volume.voxels, 100);
        this.scaledBins = this.scaleBins(this.rawBins, 1, 200);
    }

    divideIntoBins(data, binAmount) {
        let bins = [];
        let biggestDataPoint = this.max(data);

        data.forEach(dataPoint => {
            let binIndex = Math.trunc((dataPoint / biggestDataPoint) * (binAmount - 1));
            let currentCount = bins[binIndex];

            if (typeof currentCount === 'undefined') {
                bins[binIndex] = 1;
            }
            else {
                bins[binIndex]++;
            }
        });
        return bins;
    }

    scaleBins(bins, minSize, maxSize) {
        // check for division through 0
        let biggestBinSize = this.max(bins);
        let allBinsAreEmpty = biggestBinSize === 0;
        if (allBinsAreEmpty)
            return;

        // scale bins
        let scaledBins = [];
        for (let i = 0; i < bins.length; i++) {
            scaledBins[i] = (bins[i] / biggestBinSize) * maxSize;
            if (scaledBins[i] < minSize) {
                scaledBins[i] = minSize;
            }
        }
        return scaledBins;
    }

    max(arr) {
        let biggestNumber = 0;
        arr.forEach(num => {
            if (num > biggestNumber)
                biggestNumber = num;
        })
        return biggestNumber;
    }

    setupChart() {
        // let svg = d3.select('#tfContainer')
        //     .append('svg')
        //     .attr('width', 300)
        //     .attr('height', 150);

        // svg.append("g")
        //     .attr("class", "axis")
        //     .call(d3.axisLeft(y))
        //     .append("text")
        //     .style("text-anchor", "middle")
        //     // .attr("y", margin.top / 2)
        //     .text("domain name");

        this.chart = d3.select("#tfContainer")
            .selectAll("div")
            .data(this.scaledBins)
            .enter().append("div")
            .style("height", function (value) { return value + "px"; });
    }

    updateChart() {
        this.chart.data(this.scaledBins).transition(2000)
            .style("height", function (value) { return value + "px"; });
    }
}