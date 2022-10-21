class Histogram {
    constructor() {
        this.bins = [];
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
        let newBins = [];
        volume.voxels.forEach(element => {
            let binIndex = Math.trunc(element * 100);
            let currentCount = newBins[binIndex];

            if (typeof currentCount === 'undefined') {
                newBins[binIndex] = 1;
            }
            else {
                newBins[binIndex]++;
            }
        });
        this.bins = newBins;
    }

    setupD3() {

    }
}