/**
	VTF.JS
	A javascript library to create VTF (Valve Texture Format) files.
	Created by Koerismo(Baguettery)
*/


const VTF_FLAGS = {
	'point_sampling':		0x0001,	/* Point sampling 			(aka pixel art) */
	'trilinear_sampling':		0x0002,	/* Trilinear sampling 	(aka mediocre sampling) */
	'anis_sampling':		0x0004,	/* Anistrophic sampling (aka high-quality sampling) */
	'clamp_s': 			0x0008,	/* Prevent tiling on S */
	'clamp_t': 			0x0010,	/* Prevent tiling on T */
	'hint_dxt5':			0x0020,	/* Used for skyboxes */
	'normalmap':			0x0080,	/* Whether the texture is a normal map. */
	'no_mipmaps':			0x0100,	/* Disables Mipmaps */
	'no_lod': 			0x0200,	/* No Level Of Detail */
	'one_bit_alpha':		0x0400,	/* One-bit alpha */
	'eight_bit_alpha':		0x0800,	/* Eight-bit alpha */
}


String.prototype.bytes = function() { return this.split('').map((x)=>{return x.charCodeAt()}) }
Number.prototype.bytes = function(len) { return Array(len).fill('').map((x,y)=>{return (this >>> y*8) & 0xFF }) }
Number.prototype.short = function() { return [this & 0xFF, (this >>> 8) & 0xFF] }

/**
	A class that represents VTF-convertable image data.

	@author Baguettery

	@param {Array} images A list of Image() objects. These are read into a canvas to be mipmapped.
	@param {Number} flagsum The sum of image flags that this VTF should have.
	@param {String} format The format that this VTF should use when converted.
	@param {Object} args Any additional arguments, such as mipmap count.

	@returns {VTF} A new VTF object.
	@constructor
*/
class VTF {
	constructor(images, flagsum, format='RGBA8888',args={}) {
		// Throw a less ugly error instead of risking an on-export canvas error.
		images.forEach((x,y) => { if (x.width <= 0 || x.height <= 0) {throw(`Frame ${y} contains no data! Ensure that the image was preloaded. (Argument 0)`)} })

		this.images = images
		this.format = format // RGBA8888, RGB888, I8, A8, IA88, DXT1, DXT5
		this.mipmaps = args.mipmaps||1
		this.flagsum = flagsum
	}

	get header() {
		return [
			...'VTF\0'.bytes(),				//  4: Signature
			7,0,0,0,2,0,0,0,				//  8: Version number
			64,0,0,0,					//  4: Header size
			...this.images[0].width.short(),		//  2: Width
			...this.images[0].height.short(),		//  2: Height
			...this.flagsum.bytes(4),			//  4: Flags
			...this.images.length.short(),			//  2: Frame count
			0,0,						//  2: First frame index
			0,0,0,0,		// Padding

			0,0,0,0,		// 12: Reflectivity vector
			0,0,0,0,
			0,0,0,0,

			0,0,0,0,		// Padding
			0,0,0,0,		//  4: Bumpmap scale
			...this.formatIndex(this.format).bytes(4),	//  4: High-res image format ID
			this.mipmaps,					//  1: Mipmap count
			...this.formatIndex('DXT1').bytes(4),		//  4: Low-res image format ID (Always DXT1)
			0,0,			//  2: Low-res image width/height
			1			//  1: Largest mipmap depth
		]
	}

	get body() {
		var body = []
		for (let mipmap = this.mipmaps; mipmap > 0; mipmap-=1) { // Mipmaps go from smallest to largest
			for (let frame = 0; frame < this.images.length; frame++) {
				// I should have my access to any and all computers revoked because of this.
				body = body.concat([...this.encode(this.getMipmap(mipmap,frame))])
			}

		}
		return body
	}

	/**
		Creates a Uint8Array of VTF data.
		@returns {Uint8Array} VTF data.
	*/
	export() { return new Uint8Array([...this.header, ...this.body]) }

	/**
		Creates a Blob of VTF data.
		@returns {Blob} VTF data.
	*/
	blob() { return new Blob([this.export()]) }


	encode565(rgb) {
		return [
			(rgb[1] << 3) & 0b11100000 | (rgb[2] >> 3),
			(rgb[0] & 0b11111000) | (rgb[1] >> 5)
		]
	}

	/**
		Encodes the image data provided into this object's format.
		@private
	*/
	encode(ig) {
		const data = ig.data;
		var pointer = 0;

		// Int writing functions that vaguely resemble .push()
		function B8Int(x) { out.setInt8(pointer,x,true); pointer += 8; }
		function B16Int(x) { out.setInt16(pointer,x,true); pointer += 16; }
		function RGB8Int(x) { B8Int(x[0]); B8Int(x[1]); B8Int(x[2]); }

		var transform;
		var pixelLength;
		switch(this.format) {
			case 'RGB888':
				pixelLength = 3 * 8;
				transform = (x) => {
					B8Int(x[0]);
					B8Int(x[1]);
					B8Int(x[2]);
				}
				break;
			case 'RGBA8888':
				pixelLength = 4 * 8;
				transform = (x) => {
					B8Int(x[0]);
					B8Int(x[1]);
					B8Int(x[2]);
					B8Int(x[3]);
				}
				break;
			case 'RGBA16161616':
				pixelLength = 4 * 16;
				transform = (x) => {
					B16Int(x[0]);
					B16Int(x[1]);
					B16Int(x[2]);
					B16Int(x[3]);
				}
			case 'I8':
				pixelLength = 2 * 8;
				transform = (x) => {
					B8Int(x[0]);
				}
				break;
			case 'A8':
				pixelLength = 1 * 8;
				transform = (x) => {
					B8Int(x[3]);
				}
				break;
			case 'IA88':
				pixelLength = 2 * 8;
				transform = (x) => {
					B8Int(x[0]);
					B8Int(x[3]);
				}
				break;
			case 'RGB565':
				pixelLength = 2 * 8;
				transform = (x) => {
					const enc_bytes = this.encode565(x)
					B8Int(enc_bytes[0]);
					B8Int(enc_bytes[1]);
				}
				break;
			case 'DXT1':
				// pixelLength = 4 * 4 + 16 * 2;
				break;
			default:
				throw(`Format ${this.format} not recognized!`)
		}

		// DXT1 case
		if (this.format === 'DXT1') {

			function getBlock(x,y) { // Retrieves a 4x4 block of pixels starting at x,y
				let out = []	 // TODO: MAKE THIS USE UINT8ARRAY FOR EFFICIENCY
				for (let py = 0; py < 4; py++) {
					for (let px = 0; px < 4; px++) {
						const ind = ((x+px)*4)+((y+py)*ig.width*4)
						out = out.concat( Array.from(ig.data.slice(ind,ind+3)) ) // For RGBA, use ind+4
					}
				}
				return out
			}

			function compressIndex(table) {
				let out = new Uint8Array(table.length/4)
				for (let ind = 0; ind < table.length; ind+=4) {
					out[ind/4] =	((table[ind+3] << 6) & 0b11000000) |
							((table[ind+2] << 4) & 0b00110000) |
							((table[ind+1] << 2) & 0b00001100) |
							((table[ind+0] << 0) & 0b00000011)
				}
				return out
			}

			var out = new DataView(new ArrayBuffer( 4 * data.length )) // Each group of 16 pixels uses 16b for colours and 32b for indexing.
			for (var y = 0; y < ig.height; y+=4) {
				for (var x = 0; x < ig.width; x+=4) {
					const compressed = palettizeRGB(getBlock(x,y))

					// Since .encode565 returns 2 bytes, they have to be handled individually.
					const colA = this.encode565(compressed[0][0])
					const colB = this.encode565(compressed[0][1])

					RGB8Int(colA[0])	// color A
					RGB8Int(colA[1])	// color A
					RGB8Int(colB[0])	// color B
					RGB8Int(colB[1])	// color B
					
					// Compress index into bits
					compressIndex(compressed[1]).forEach(x => { B8Int(x); })
				}
			}
		}

		// Uncompressed formats
		else {
			// Generate new array with predetermined length, then run the transform function for each pixel.
			var out = new DataView(new ArrayBuffer(pixelLength * data.length))
			for (let p = 0; p < data.length; p += 4) {
				let pixelSet = [ data[p], data[p+1], data[p+2], data[p+3] ];
				transform(pixelSet);
			}
		}

		return new Uint8Array(out.buffer)
	}

	/**
		Renders the input frame at a size of 0.5**(index-1) and returns the image data.
		@private
	*/
	getMipmap(index,frame) {
		var tCanv = document.createElement('CANVAS')
		tCanv.width = this.images[0].width/(2**(index-1))
		tCanv.height = this.images[0].height/(2**(index-1))
		var tCtx = tCanv.getContext('2d')
		tCtx.drawImage(this.images[frame],0,0,tCanv.width,tCanv.height)
		return tCtx.getImageData(0,0,tCanv.width,tCanv.height)
	}

	/**
		Retrieves the format index for use in the header block.
		@private
	*/
	formatIndex(x) {
		const formats = {
			'RGBA8888': 0,
			'RGB888': 2,
			'RGB565': 4,
			'I8': 5,
			'IA88': 6,
			'A8': 8,
			'DXT1': 13,
			'DXT3': 14,
			'DXT5': 15,
			'RGBA16161616': 25
		}
		if (formats[x] != undefined) {return formats[x]}
		else {return null}
	}
}
