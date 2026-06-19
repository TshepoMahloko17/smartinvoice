import "jest-preset-angular/setup-jest";

// Force-overwrite HTMLCanvasElement.getContext to prevent jsdom "not implemented" errors
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 }),
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      setLineDash: () => {},
      getLineDash: () => [],
    };
  };
}

// Mock ng2-charts and chart.js so tests won't try to acquire a real canvas context
try {
  // @ts-ignore
  jest.doMock("ng2-charts", () => {
    const { Directive } = require("@angular/core");
    // Create a mock directive that's standalone so TestBed can import it
    // Use the real selector and expose common inputs so template bindings work
    const BaseChartDirective = Directive({
      standalone: true,
      selector: "canvas[baseChart]",
      inputs: ["data", "options"],
    })(
      class {
        data: any;
        options: any;
        constructor() {}
        ngOnChanges() {}
      },
    );
    return { BaseChartDirective };
  });

  // @ts-ignore
  jest.doMock("chart.js", () => ({
    Chart: class {},
  }));
} catch (e) {
  // jest may not be defined in some environments; ignore
}
