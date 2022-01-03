var VtfEncodings = /** @class */ (function () {
    function VtfEncodings() {
    }
    VtfEncodings.RGB888 = {
        name: 'RGB888',
        index: 2,
        encode: function (image) {
            var target = new Uint8Array(image.data.length * 3 / 4);
            for (var i = 0; i < image.data.length; i += 4) {
                var t = i * 3 / 4;
                target[t + 0] = image.data[i + 0],
                    target[t + 1] = image.data[i + 1],
                    target[t + 2] = image.data[i + 2];
            }
            return target;
        },
        decode: function (vtfdata) {
            var target = new Uint8Array(vtfdata.data.length * 4 / 3);
            for (var i = 0; i < vtfdata.data.length; i += 3) {
                var t = i * 4 / 3;
                target[t + 0] = vtfdata.data[i + 0],
                    target[t + 1] = vtfdata.data[i + 1],
                    target[t + 2] = vtfdata.data[i + 2];
            }
            return target;
        }
    };
    VtfEncodings.RGBA8888 = {
        name: 'RGBA8888',
        index: 2,
        encode: function (image) {
            return new Uint8Array(image.data);
        },
        decode: function (vtfdata) {
            return vtfdata.data;
        }
    };
    VtfEncodings.RGBA8888 = {
        name: 'RGBA8888',
        index: 2,
        encode: function (image) {
            return new Uint8Array(image.data);
        },
        decode: function (vtfdata) {
            return vtfdata.data;
        }
    };
    return VtfEncodings;
}());
export { VtfEncodings };
