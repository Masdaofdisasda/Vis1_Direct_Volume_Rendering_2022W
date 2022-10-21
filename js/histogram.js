class Histogram {
    constructor() {
        this.rawBins = [];
        this.prettyBins = [];
        this.chart = null;
    }

    update(volume) {
        if (this.chart === null) {
            this.setup(volume);
            return;
        }
        // TODO: update bins
    }

    setup(volume) {
        this.setBins(volume);
        this.setupD3(volume);
    }

    setBins(volume) {
        let rawBins = [];
        volume.voxels.forEach(element => {
            let binIndex = Math.trunc(element * 100);
            let currentCount = rawBins[binIndex];

            if (typeof currentCount === 'undefined') {
                rawBins[binIndex] = 1;
            }
            else {
                rawBins[binIndex]++;
            }
        });
        this.rawBins = rawBins;
        
        let biggestBinSize = 0;
        rawBins.forEach(bin => {
            if(bin > biggestBinSize)
                biggestBinSize = bin;
        })
        if(biggestBinSize === 0){
            return;
        }

        let normalizedBins = [];
        for (let i = 0; i < rawBins.length; i++) {
            normalizedBins[i] = (rawBins[i]/biggestBinSize)*200;
            if(normalizedBins[i] > 0 && normalizedBins[i] < 1){
                normalizedBins[i] = 1;
            }
        }
        this.prettyBins = normalizedBins;
    }

    setupD3() {
        this.chart = d3.select("#tfContainer")
            .selectAll("div")
            .data(this.prettyBins)
            .enter().append("div")
            .style("height", function (value) { return value + "px"; });
    }
}