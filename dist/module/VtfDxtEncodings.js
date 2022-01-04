var VtfDxtEncodings = /** @class */ (function () {
    function VtfDxtEncodings() {
    }
    VtfDxtEncodings.groupBlocks = function (image) {
        var grouped = new Array(image.data.length / 64);
        grouped.fill(new Uint8Array(64));
        for (var pointer = 0; pointer < image.data.length; pointer += 4) {
            var x = (pointer / 4) % image.width;
            var y = Math.floor(pointer / image.width / 4);
            var group = Math.floor(x / 4) + Math.floor(y / 4) * image.width / 4;
            var groupPixelIndex = (x % 4 + (y % 4) * 4) * 4;
            grouped[group][groupPixelIndex + 0] = image.data[pointer + 0],
                grouped[group][groupPixelIndex + 1] = image.data[pointer + 1],
                grouped[group][groupPixelIndex + 2] = image.data[pointer + 2],
                grouped[group][groupPixelIndex + 3] = image.data[pointer + 3];
        }
        return grouped;
    };
    VtfDxtEncodings.palettizeBlock = function (block) {
        /* Find the two most contrasting colors. */
        var maxContrastDiff = 0;
        var duo = { a: null, b: null };
        for (var pixA = 0; pixA < block.length; pixA += 4) {
            for (var pixB = pixA; pixB < block.length; pixB += 4) {
                if (pixA == pixB) {
                    continue;
                }
                var colA = new Color(block[pixA], block[pixA + 1], block[pixA + 2]);
                var colB = new Color(block[pixB], block[pixB + 1], block[pixB + 2]);
                var diff = Color.diff(colA, colB);
                if (diff >= maxContrastDiff) {
                    maxContrastDiff = diff,
                        duo.a = colA,
                        duo.b = colB;
                }
            }
        }
        /* Lerp these colors to make a 4-color palette. */
        var palette = [
            duo.a,
            Color.lerp(duo.a, duo.b, 0.333),
            Color.lerp(duo.a, duo.b, 0.666),
            duo.b
        ];
        if (duo.a.value() < duo.b.value()) {
            palette.reverse();
        }
        var indexed = new Uint8Array(16);
        /* For each pixel, find the closest palette entry and index it. */
        for (var pixel = 0; pixel < block.length; pixel += 4) {
            var pixelMinPaletteDiff = null;
            var pixelClosestResult = null;
            var pixelColor = new Color(block[pixel], block[pixel + 1], block[pixel + 2]);
            for (var paletteEntry = 0; paletteEntry < 4; paletteEntry++) {
                var currentDiff = Color.diff(palette[paletteEntry], pixelColor);
                if (currentDiff <= pixelMinPaletteDiff || pixelMinPaletteDiff == null) {
                    pixelMinPaletteDiff = currentDiff;
                    pixelClosestResult = paletteEntry;
                }
            }
            indexed[pixel / 4] = pixelClosestResult;
        }
        return [indexed, duo.a, duo.b];
    };
    VtfDxtEncodings.DXT1 = {
        name: 'DXT1',
        index: 13,
        encode: function (image) {
            /* Group pixels into 4x4 blocks. */
            var grouped = VtfDxtEncodings.groupBlocks(image);
            var target = new DataView(new ArrayBuffer(image.data.length / 4));
            var pointer = 0;
            for (var block = 0; block < grouped.length; block++) {
                var _a = VtfDxtEncodings.palettizeBlock(grouped[block]), indexed = _a[0], paletteA = _a[1], paletteB = _a[2];
                console.log(indexed, paletteA, paletteB);
                for (var i = 0; i < indexed.length; i += 4) {
                    target.setInt8(pointer, ((indexed[i + 3] >> 0 & 192) |
                        (indexed[i + 2] >> 2 & 48) |
                        (indexed[i + 1] >> 4 & 12) |
                        (indexed[i + 0] >> 6 & 3)));
                    pointer += 1;
                }
                target.setInt16(pointer, paletteA.value(), true);
                target.setInt16(pointer + 2, paletteB.value(), true);
                pointer += 4;
            }
            return new Uint8Array(target.buffer);
        },
        decode: function (data) {
            return;
        }
    };
    VtfDxtEncodings.DXT5 = {
        name: 'DXT5',
        index: 15,
        encode: function (image) {
            return;
        },
        decode: function (data) {
            return;
        }
    };
    return VtfDxtEncodings;
}());
export { VtfDxtEncodings };
var Color = /** @class */ (function () {
    function Color(r, g, b, a) {
        if (a === void 0) { a = 255; }
        this.r = r,
            this.g = g,
            this.b = b,
            this.a = a;
    }
    Color.prototype.value = function () {
        return ((this.r << 8 & 63488) |
            (this.g << 3 & 2016) |
            (this.r >> 3 & 31));
    };
    Color.diff = function (A, B) {
        return Math.pow((Math.pow((B.r - A.r), 2) + Math.pow((B.g - A.g), 2) + Math.pow((B.b - A.b), 2)), 0.5);
    };
    Color.lerp = function (A, B, mix) {
        return new Color(B.r * mix + A.r * (1 - mix), B.g * mix + A.g * (1 - mix), B.b * mix + A.b * (1 - mix));
    };
    return Color;
}());
