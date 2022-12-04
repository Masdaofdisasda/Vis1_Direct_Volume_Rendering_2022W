class Histogram {
    constructor() {
        this.rawBins = [];
        this.prettyBins = [];
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
        let rawBins = [];
        let biggestRawBin = this.max(volume.voxels);

        volume.voxels.forEach(element => {
            let binIndex = Math.trunc((element/biggestRawBin) * 100);
            let currentCount = rawBins[binIndex];

            if (typeof currentCount === 'undefined') {
                rawBins[binIndex] = 1;
            }
            else {
                rawBins[binIndex]++;
            }
        });
        this.rawBins = rawBins;

        let biggestBinSize = this.max(rawBins);
        if (biggestBinSize === 0) {
            return;
        }

        let normalizedBins = [];
        for (let i = 0; i < rawBins.length; i++) {
            normalizedBins[i] = Math.log2(rawBins[i] / biggestBinSize) * 200;
            if (normalizedBins[i] > 0 && normalizedBins[i] < 1) {
                normalizedBins[i] = 1;
            }
        }
        this.prettyBins = normalizedBins;
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
        this.chart = d3.select("#tfContainer")
            .selectAll("div")
            .data(this.prettyBins)
            .enter().append("div")
            .style("height", function (value) { return value + "px"; });
    }

    updateChart() {
        this.chart.data(this.prettyBins).transition(2000)
            .style("height", function (value) { return value + "px"; });
    }
}