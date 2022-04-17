import { Color } from "./VtfContainer.js";
export class VtfDxtEncodings {
    static groupBlocks(image) {
        const grouped = new Array(image.data.length / 64);
        for (let i = 0; i < grouped.length; i++) {
            grouped[i] = new Uint8Array(64);
        }
        for (let pointer = 0; pointer < image.data.length; pointer += 4) {
            // Pixel index
            const pixel = pointer / 4;
            // Pixel coordinates
            const x = pixel % image.width;
            const y = Math.floor(pixel / image.width);
            // 4x4 block index (right to left, top to bottom), pixel index within block
            const group = Math.floor(x / 4) + Math.floor(y / 4) * image.width / 4;
            const groupPixelIndex = (x % 4 + (y % 4) * 4) * 4;
            grouped[group][groupPixelIndex + 0] = image.data[pointer + 0],
                grouped[group][groupPixelIndex + 1] = image.data[pointer + 1],
                grouped[group][groupPixelIndex + 2] = image.data[pointer + 2],
                grouped[group][groupPixelIndex + 3] = image.data[pointer + 3];
            //console.log(`Pixel ${pixel} - coordinates ${x},${y} - group ${group} - group pixel ${groupPixelIndex/4}`)
        }
        return grouped;
    }
    static palettizeBlock(block) {
        /* Find the two most contrasting colors. */
        var maxContrastDiff = 0;
        const duo = { a: null, b: null };
        for (let pixA = 0; pixA < block.length; pixA += 4) {
            for (let pixB = pixA; pixB < block.length; pixB += 4) {
                if (pixA == pixB) {
                    continue;
                }
                const colA = new Color(block[pixA], block[pixA + 1], block[pixA + 2]);
                const colB = new Color(block[pixB], block[pixB + 1], block[pixB + 2]);
                const diff = Color.diff(colA, colB);
                if (diff >= maxContrastDiff) {
                    maxContrastDiff = diff,
                        duo.a = colA,
                        duo.b = colB;
                }
            }
        }
        /* Lerp these colors to make a 4-color palette. */
        const palette = [
            duo.a,
            Color.lerp(duo.a, duo.b, 0.333),
            Color.lerp(duo.a, duo.b, 0.666),
            duo.b
        ];
        const duoAValue = duo.a.value(), duoBValue = duo.b.value();
        if (duoAValue < duoBValue) {
            palette.reverse();
        }
        const indexed = new Uint8Array(16);
        /* For each pixel, find the closest palette entry and index it. */
        for (let pixel = 0; pixel < block.length; pixel += 4) {
            let pixelMinPaletteDiff = 442; // Slightly higher than the maximum possible difference, just as a starting value.
            let pixelClosestResult = null; // The choice for what palette index matches the best
            const pixelColor = new Color(block[pixel], block[pixel + 1], block[pixel + 2]);
            for (let paletteEntry = 0; paletteEntry < 4; paletteEntry++) {
                const currentDiff = Color.diff(palette[paletteEntry], pixelColor);
                if (currentDiff <= pixelMinPaletteDiff) {
                    pixelMinPaletteDiff = currentDiff;
                    pixelClosestResult = paletteEntry;
                }
            }
            switch (pixelClosestResult) {
                case 0:
                    break;
                case 1:
                    pixelClosestResult = 2;
                    break;
                case 2:
                    pixelClosestResult = 3 - (duoAValue == duoBValue);
                    break;
                case 3:
                    pixelClosestResult = 1;
                    break;
            }
            indexed[pixel / 4] = pixelClosestResult;
        }
        return [indexed, palette[0], palette[3]];
    }
}
VtfDxtEncodings.DXT1 = {
    name: 'DXT1',
    index: 13,
    ratio: 1,
    encode: function (image) {
        /* Group pixels into 4x4 blocks. */
        const grouped = VtfDxtEncodings.groupBlocks(image);
        const target = new DataView(new ArrayBuffer(image.data.length / 8));
        var pointer = 0;
        for (var block = 0; block < grouped.length; block++) {
            /* Compress pixel groups with palette */
            const [indexed, paletteA, paletteB] = VtfDxtEncodings.palettizeBlock(grouped[block]);
            /* Write palette */
            target.setInt16(pointer, paletteA.value(), true);
            target.setInt16(pointer + 2, paletteB.value(), true);
            pointer += 4;
            /* Write pixel data */
            for (var i = 0; i < indexed.length; i += 4) {
                target.setInt8(pointer, ((indexed[i + 3] << 6 & 0b11000000) |
                    (indexed[i + 2] << 4 & 0b00110000) |
                    (indexed[i + 1] << 2 & 0b00001100) |
                    (indexed[i + 0] << 0 & 0b00000011)));
                pointer += 1;
            }
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
    ratio: 2,
    encode: function (image) {
        return;
    },
    decode: function (data) {
        return;
    }
};
