var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FrameReadOnly_mipmaps, _FrameReadOnly_vtf;
import "./DataViewString.js";
export class Vtf {
    constructor(size, resources, format = 'RGB888', mipmaps = 1, version = [7, 5], flags = 0) {
        this.size = size,
            this.format = format,
            this.mipmaps = mipmaps,
            this.version = version,
            this.flags = flags;
        this.resources = resources;
        this.checkErrors();
    }
    static registerCodec(encoder) {
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
    }
    static codecByIndex(index) {
        for (let c = 0; c < Object.keys(this.codecs).length; c++) {
            if (this.codecs[Object.keys(this.codecs)[c]].index == index) {
                return this.codecs[c];
            }
        }
    }
    getResource(tag) {
        var out = null;
        for (var i in this.resources) {
            if (this.resources[i].tag == tag) {
                out = this.resources[i];
            }
        }
        return out;
    }
    checkErrors() {
        if (Math.log2(this.size[0]) % 1 > 0 || Math.log2(this.size[1]) % 1 > 0) {
            throw (`SizeError: VTF has non-power of two size (${this.size[0]}x${this.size[1]})`);
        }
        if (!(this.format in Vtf.codecs)) {
            throw (`ValueError: VTF using unknown format "${this.format}"`);
        }
        if (this.version[0] != 7 || this.version[1] < 3 || this.version[1] > 5) {
            throw (`ValueError: VTF using unsupported version (${this.version[0]}.${this.version[1]})`);
        }
    }
    header() {
        const headerLength = 80; // v7.3+
        const data = new DataView(new ArrayBuffer(headerLength));
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
    }
    body() {
        this.checkErrors();
        const headers = [];
        const bodies = [];
        headers.push(this.header());
        var pointer = this.resources.length * 8 + headers[0].length;
        for (var i in this.resources) {
            this.resources[i].offset = pointer;
            const entryHeader = this.resources[i].header();
            const entryBody = this.resources[i].body(this);
            pointer += entryBody.length;
            headers.push(entryHeader);
            bodies.push(entryBody);
        }
        const fileLength = headers.reduce((a, b) => { return a + b.length; }, 0) +
            bodies.reduce((a, b) => { return a + b.length; }, 0);
        const target = new Uint8Array(fileLength);
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
    }
    blob() {
        return new Blob([this.body()]);
    }
    static load(buffer) {
        const data = new DataView(buffer);
        /* Read header */
        if (data.byteLength < 4 || data.getString(0, 4) != 'VTF\0') {
            throw ('ParseError: File missing VTF signature!');
        }
        const vtfVersion = [data.getUint32(4, true), data.getUint32(8, true)];
        const vtfHeaderSize = data.getUint32(12, true);
        const vtfImageSize = [data.getUint16(16, true), data.getUint16(18, true)];
        const vtfFlags = data.getUint32(20, true);
        const vtfFrameCount = data.getUint16(24);
        // Frame first index
        // Reflectivity vector
        // Bumpmap scale
        const vtfFormat = data.getUint32(52, true);
        const vtfMipmapCount = data.getUint8(56);
        // Low-res image format. (Unnecessary to read, always DXT1)
        const VtfLowResImageSize = [data.getUint8(61), data.getUint8(62)];
        // Imaege depth
        const vtfResourceCount = data.getUint32(68, true);
        // Resources start at 76
        if (vtfVersion[0] != 7 || vtfVersion[1] < 3 || vtfVersion[1] > 5) {
            throw (`ParseError: File using unsupported version (${vtfVersion[0]}.${vtfVersion[1]})`);
        }
        /* Read resources */
        const vtfResources = new Array(vtfResourceCount);
        let resourceBodyPointer = vtfHeaderSize;
        for (let res = 0; res < vtfResourceCount; res++) {
            const i = vtfHeaderSize - vtfResourceCount * 8 + res * 8;
            const resourceTag = data.getString(i, 3);
            const resourceFlags = data.getUint8(i + 3);
            const resourceBodyOffset = data.getUint32(i + 4, true);
            // Add dummy resources to the list with header data
            vtfResources[res] = new VtfResource(new Uint8Array(0), resourceTag);
            vtfResources[res].flags = resourceFlags;
            vtfResources[res].offset = resourceBodyOffset;
        }
        // Go through the list again and fill out all of the bodies
        for (let res = 0; res < vtfResourceCount; res++) {
            const resourceBodyLength = (res + 1 < vtfResourceCount) ? vtfResources[res + 1].offset : data.byteLength;
            vtfResources[res].readFrom(data, resourceBodyLength);
        }
        // Create VTF
        const vtf = new Vtf(vtfImageSize, vtfResources, Vtf.codecByIndex(vtfFormat), vtfMipmapCount, vtfVersion, vtfFlags);
        // Deconstruct mipmaps
        const vtfImageBody = vtf.getResource('\x30\0\0');
        if (vtfImageBody == null) {
            throw ('ParseError: VTF does not have a body resource entry');
        }
        let vtfImageBodyTargetlength = 0;
        for (let m = 0; m < vtfMipmapCount; m++) {
            vtfImageBodyTargetlength += (vtfImageSize[0] * vtfImageSize[1]) / 2 ** m;
        }
        const imagePixelRatio = vtfImageBody.data.byteLength / vtfImageBodyTargetlength;
        console.log(`pixel ratio is ${imagePixelRatio}`);
        return vtf;
    }
}
/* Static Component */
Vtf.codecs = {};
export class Frame {
    constructor(image) {
        this.image = image;
    }
    mipmap(vtf, depth) {
        const canvas = document.createElement('canvas');
        canvas.width = vtf.size[0] / (2 ** (depth - 1));
        canvas.height = vtf.size[1] / (2 ** (depth - 1));
        const context = canvas.getContext('2d');
        context.drawImage(this.image, 0, 0, canvas.width, canvas.height);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }
}
export class FrameReadOnly {
    constructor(vtf, mipmaps) {
        _FrameReadOnly_mipmaps.set(this, void 0);
        _FrameReadOnly_vtf.set(this, void 0);
        __classPrivateFieldSet(this, _FrameReadOnly_mipmaps, mipmaps, "f");
    }
    mipmap(depth) {
        if (depth < 1 || depth > __classPrivateFieldGet(this, _FrameReadOnly_vtf, "f").mipmaps) {
            throw (`ValueError: Mipmap of depth ${depth} is out of range!`);
        }
        return __classPrivateFieldGet(this, _FrameReadOnly_mipmaps, "f")[depth];
    }
}
_FrameReadOnly_mipmaps = new WeakMap(), _FrameReadOnly_vtf = new WeakMap();
export class VtfImageData {
    constructor(data, width, height) {
        this.data = data,
            this.width = width,
            this.height = height;
    }
}
export class VtfResource {
    constructor(data, tag) {
        this.data = data;
        this.tag = tag;
        this.offset = -1;
    }
    header() {
        const data = new DataView(new ArrayBuffer(8));
        data.setString(0, this.tag, 'ASCII'); // Resource type tag
        data.setUint8(3, 0); // Flag (not applicable)
        data.setUint32(4, this.offset, true); // Resource data file offset
        return new Uint8Array(data.buffer);
    }
    body(vtf) {
        return this.data;
    }
    readFrom(data, length, offset) {
        if (offset == undefined) {
            offset = this.offset;
        }
        this.data = new Uint8Array(length);
        for (let byte = offset; byte < offset + length; byte++) {
            this.data[byte] = data[byte + offset];
        }
        return;
    }
}
export class VtfImageResource extends VtfResource {
    constructor(frames) {
        super(null, '\x30\0\0');
        this.frames = frames;
    }
    body(vtf) {
        const raw = new Array(this.frames.length * vtf.mipmaps);
        var rawPointer = 0;
        for (var mipIndex = vtf.mipmaps; mipIndex > 0; mipIndex--) {
            for (var frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
                const mip = this.frames[frameIndex].mipmap(vtf, mipIndex);
                raw[rawPointer] = Vtf.codecs[vtf.format].encode(mip);
                rawPointer += 1;
            }
        }
        const targetLength = raw.reduce((a, b) => { return a + b.length; }, 0);
        const target = new Uint8Array(targetLength);
        var pointer = 0;
        for (var mipIndex = 0; mipIndex < raw.length; mipIndex++) {
            for (var byte = 0; byte < raw[mipIndex].length; byte++) {
                target[pointer] = raw[mipIndex][byte];
                pointer += 1;
            }
        }
        return target;
    }
}
export class Color {
    constructor(r, g, b, a = 255) {
        this.r = r,
            this.g = g,
            this.b = b,
            this.a = a;
    }
    value() {
        return ((this.r << 8 & 0b1111100000000000) |
            (this.g << 3 & 0b0000011111100000) |
            (this.b >> 3 & 0b0000000000011111));
    }
    static diff(A, B) {
        return ((B.r - A.r) ** 2 + (B.g - A.g) ** 2 + (B.b - A.b) ** 2) ** 0.5;
    }
    static lerp(A, B, mix) {
        return new Color(B.r * mix + A.r * (1 - mix), B.g * mix + A.g * (1 - mix), B.b * mix + A.b * (1 - mix));
    }
}
