var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import "./DataViewString.js";
var Vtf = /** @class */ (function () {
    function Vtf(size, resources, format, mipmaps, version, flags) {
        if (format === void 0) { format = 'RGB888'; }
        if (mipmaps === void 0) { mipmaps = 1; }
        if (version === void 0) { version = [7, 5]; }
        if (flags === void 0) { flags = 0; }
        this.size = size,
            this.format = format,
            this.mipmaps = mipmaps,
            this.version = version,
            this.flags = flags;
        this.resources = resources;
        this.checkErrors();
    }
    Vtf.registerCodec = function (encoder) {
        if (!('name' in encoder)) {
            throw ('Codec lacks name!');
        }
        if (!('index' in encoder)) {
            throw ('Codec lacks index property!');
        }
        if (!('encode' in encoder)) {
            throw ('Codec lacks encoder function!');
        }
        if (!('decode' in encoder)) {
            throw ('Codec lacks decoder function!');
        }
        this.codecs[encoder.name] = encoder;
    };
    Vtf.prototype.getResource = function (tag) {
        var out = null;
        for (var i in this.resources) {
            if (this.resources[i].tag == tag) {
                out = this.resources[i];
            }
        }
        return out;
    };
    Vtf.prototype.checkErrors = function () {
        if (Math.log2(this.size[0]) % 1 > 0 || Math.log2(this.size[1]) % 1 > 0) {
            throw ("SizeError: VTF has non-power of two size (".concat(this.size[0], "x").concat(this.size[1], ")"));
        }
        if (!(this.format in Vtf.codecs)) {
            throw ("ValueError: VTF using unknown format \"".concat(this.format, "\""));
        }
        if (this.version[0] != 7 || this.version[1] < 3 || this.version[1] > 5) {
            throw ("ValueError: VTF using unsupported version (".concat(this.version[0], ".").concat(this.version[1], ")"));
        }
    };
    Vtf.prototype.header = function () {
        var headerLength = 80; // v7.3+
        var data = new DataView(new ArrayBuffer(headerLength));
        data.setString(0, 'VTF\0', 'ASCII'); // 4: Identifier
        data.setUint32(4, this.version[0], true); // 4: Version[0]
        data.setUint32(8, this.version[1], true); // 4: Version[1]
        data.setUint32(12, headerLength + this.resources.length * 8, true); // 4: Header length
        data.setUint16(16, this.size[0], true); // 2: Width
        data.setUint16(18, this.size[1], true); // 2: Height
        data.setUint32(20, this.flags, true); // 4: Flags
        data.setUint16(24, this.getResource('\x30\0\0').frames.length, true); // 2: Frames
        data.setUint16(26, 0, true); // 2: First frame
        // Padding[4]
        data.setFloat32(32, 0, true); // 4: Reflectivity[0]
        data.setFloat32(36, 0, true); // 4: Reflectivity[1]
        data.setFloat32(40, 0, true); // 4: Reflectivity[2]
        // Padding[4]
        data.setFloat32(48, 1, true); // 4: Bumpmap scale
        data.setUint32(52, Vtf.codecs[this.format].index, true); // 4: Format id
        data.setUint8(56, this.mipmaps); // 1: Mipmaps
        data.setUint32(57, Vtf.codecs['DXT1'].index, true); // 4: Low-res format id
        data.setUint8(61, 0); // 1: Low-res width
        data.setUint8(62, 0); // 1: Low-res height
        data.setUint16(63, 1, true); // 2: Image depth
        // Padding[3]
        data.setUint32(68, this.resources.length, true); // 2: Resource entry count
        // Padding[8]
        return new Uint8Array(data.buffer);
    };
    Vtf.prototype.body = function () {
        this.checkErrors();
        var headers = [];
        var bodies = [];
        headers.push(this.header());
        var pointer = this.resources.length * 8 + headers[0].length;
        for (var i in this.resources) {
            var entryHeader = this.resources[i].header(pointer);
            var entryBody = this.resources[i].body(this);
            pointer += entryBody.length;
            headers.push(entryHeader);
            bodies.push(entryBody);
        }
        var fileLength = headers.reduce(function (a, b) { return a + b.length; }, 0) +
            bodies.reduce(function (a, b) { return a + b.length; }, 0);
        var target = new Uint8Array(fileLength);
        var filePointer = 0;
        for (var header = 0; header < headers.length; header++) {
            for (var byte = 0; byte < headers[header].length; byte++) {
                target[filePointer] = headers[header][byte];
                filePointer += 1;
            }
        }
        for (var body = 0; body < bodies.length; body++) {
            for (var byte = 0; byte < bodies[body].length; byte++) {
                target[filePointer] = bodies[body][byte];
                filePointer += 1;
            }
        }
        return target;
    };
    /* Static Component */
    Vtf.codecs = {};
    return Vtf;
}());
export { Vtf };
var Frame = /** @class */ (function () {
    function Frame(image) {
        this.image = image;
    }
    Frame.prototype.mipmap = function (vtf, depth) {
        var canvas = document.createElement('canvas');
        canvas.width = vtf.size[0] / (Math.pow(2, (depth - 1)));
        canvas.height = vtf.size[1] / (Math.pow(2, (depth - 1)));
        var context = canvas.getContext('2d');
        context.drawImage(this.image, 0, 0, canvas.width, canvas.height);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    };
    return Frame;
}());
export { Frame };
var VtfImageData = /** @class */ (function () {
    function VtfImageData(data, width, height) {
        this.data = data,
            this.width = width,
            this.height = height;
    }
    return VtfImageData;
}());
export { VtfImageData };
var VtfResource = /** @class */ (function () {
    function VtfResource(data, tag) {
        this.data = data;
        this.tag = tag;
    }
    VtfResource.prototype.header = function (offset) {
        var data = new DataView(new ArrayBuffer(8));
        data.setString(0, this.tag, 'ASCII'); // Resource type tag
        data.setUint8(3, 0); // Flag (not applicable)
        data.setUint32(4, offset, true); // Resource data file offset
        return new Uint8Array(data.buffer);
    };
    VtfResource.prototype.body = function (vtf) {
        return this.data;
    };
    return VtfResource;
}());
export { VtfResource };
var VtfImageResource = /** @class */ (function (_super) {
    __extends(VtfImageResource, _super);
    function VtfImageResource(frames) {
        var _this = _super.call(this, null, '\x30\0\0') || this;
        _this.frames = frames;
        return _this;
    }
    VtfImageResource.prototype.body = function (vtf) {
        var raw = new Array(this.frames.length * vtf.mipmaps);
        var rawPointer = 0;
        for (var mipIndex = vtf.mipmaps; mipIndex > 0; mipIndex--) {
            for (var frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
                var mip = this.frames[frameIndex].mipmap(vtf, mipIndex);
                raw[rawPointer] = Vtf.codecs[vtf.format].encode(mip);
                rawPointer += 1;
            }
        }
        var targetLength = raw.reduce(function (a, b) { return a + b.length; }, 0);
        var target = new Uint8Array(targetLength);
        var pointer = 0;
        for (var mipIndex = 0; mipIndex < raw.length; mipIndex++) {
            for (var byte = 0; byte < raw[mipIndex].length; byte++) {
                target[pointer] = raw[mipIndex][byte];
                pointer += 1;
            }
        }
        return target;
    };
    return VtfImageResource;
}(VtfResource));
export { VtfImageResource };
