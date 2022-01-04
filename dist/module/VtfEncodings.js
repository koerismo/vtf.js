var VtfEncodings = /** @class */ (function () {
    function VtfEncodings() {
    }
    VtfEncodings.RGBA8888 = {
        name: 'RGBA8888',
        index: 0,
        encode: function (image) {
            return new Uint8Array(image.data);
        },
        decode: function (vtfdata) {
            return vtfdata.data;
        }
    };
    VtfEncodings.ABGR8888 = {
        name: 'ABGR8888',
        index: 1,
        encode: function (image) {
            var target = new Uint8Array(image.data.length);
            for (var i = 0; i < image.data.length; i += 4) {
                target[i + 3] = image.data[i + 0],
                    target[i + 2] = image.data[i + 1],
                    target[i + 1] = image.data[i + 2],
                    target[i + 0] = image.data[i + 3];
            }
            return target;
        },
        decode: function (vtfdata) {
            var target = new Uint8Array(vtfdata.data.length);
            for (var i = 0; i < vtfdata.data.length; i += 4) {
                target[i + 0] = vtfdata.data[i + 3],
                    target[i + 1] = vtfdata.data[i + 2],
                    target[i + 2] = vtfdata.data[i + 1],
                    target[i + 3] = vtfdata.data[i + 0];
            }
            return target;
        }
    };
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
    VtfEncodings.BGR888 = {
        name: 'BGR888',
        index: 3,
        encode: function (image) {
            var target = new Uint8Array(image.data.length * 3 / 4);
            for (var i = 0; i < image.data.length; i += 4) {
                var t = i * 3 / 4;
                target[t + 2] = image.data[i + 0],
                    target[t + 1] = image.data[i + 1],
                    target[t + 0] = image.data[i + 2];
            }
            return target;
        },
        decode: function (vtfdata) {
            var target = new Uint8Array(vtfdata.data.length * 4 / 3);
            for (var i = 0; i < vtfdata.data.length; i += 3) {
                var t = i * 4 / 3;
                target[t + 0] = vtfdata.data[i + 2],
                    target[t + 1] = vtfdata.data[i + 1],
                    target[t + 2] = vtfdata.data[i + 0];
            }
            return target;
        }
    };
    VtfEncodings.RGB565 = {
        name: 'RGB565',
        index: 4,
        encode: function (image) {
            var target = new DataView(new ArrayBuffer(image.data.length / 2));
            for (var i = 0; i < image.data.length; i += 4) {
                var t = i / 2;
                target.setInt16(t, ((image.data[i + 0] << 8 & 63488) |
                    (image.data[i + 1] << 3 & 2016) |
                    (image.data[i + 2] >> 3 & 31)), true);
            }
            return new Uint8Array(target.buffer);
        },
        decode: function (vtfdata) {
            /* NOT FINISHED */
            return;
        }
    };
    return VtfEncodings;
}());
export { VtfEncodings };
