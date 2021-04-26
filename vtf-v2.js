/*
VTF.JS
A javascript library to create VTF (Valve Texture Format) files.
Created by Koerismo(Baguettery)
*/


const VTF_FLAGS = {
	'point_sampling':		0x0001,	/* Point sampling 			(aka pixel art) */
	'trilinear_sampling':	0x0002,	/* Trilinear sampling 	(aka mediocre sampling) */
	'anis_sampling':		0x0004,	/* Anistrophic sampling (aka high-quality sampling) */
	'clamp_s': 				0x0008,	/* Prevent tiling on S */
	'clamp_t': 				0x0010,	/* Prevent tiling on T */
	'hint_dxt5':			0x0020,	/* Used for skyboxes */
	'normalmap':			0x0080,	/* Whether the texture is a normal map. */
	'no_mipmaps':			0x0100,	/* Disables Mipmaps */
	'no_lod': 				0x0200,	/* No Level Of Detail */
	'one_bit_alpha':		0x0400,	/* One-bit alpha */
	'eight_bit_alpha':		0x0800,	/* Eight-bit alpha */
}



String.prototype.bytes = function() { return this.split('').map((x)=>{return x.charCodeAt()}) }

Number.prototype.bytes = function(len) { return Array(len).fill('').map((x,y)=>{return (this >>> y*8) & 0xFF }) }

Number.prototype.short = function() { return [this & 0xFF, (this >>> 8) & 0xFF] }

/* // These aren't being used anywhere, but I'm keeping them just in case.
Uint8ClampedArray.prototype.shorts = function() {
	let out = []
	this.forEach((x)=>{ out = out.concat( x.bytes(2) ) })
	return new Uint8ClampedArray(out)
}

Array.prototype.shorts = function() {
	let out = []
	this.forEach((x)=>{ out = out.concat( x.short() ) })
	return out
}
*/


class VTF {
	constructor(images, flagsum, format='RGBA8888',args={}) {
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
				body = body.concat( this.encode(this.getMipmap(mipmap,frame)) )
			}
		}
		return body
	}

	export() { return new Uint8Array(this.header.concat(this.body)) }
	blob() { return new Blob([this.export()]) }

	encode(x) {
		// Takes RGBA image data and transforms into the vtf encoding
		var transform;
		switch(this.format) {
			case 'RGB888':
				transform = (x)=>{return [ x[0],x[1],x[2] ]}
				break;
			case 'RGBA8888':
				transform = (x)=>{return [ x[0],x[1],x[2],x[3] ]}
				break;
			case 'I8':
				transform = (x)=>{return [ x[0] ]} /* Use red channel for greyscale */
				break;
			case 'A8':
				transform = (x)=>{return [ x[3] ]}
				break;
			case 'IA88':
				transform = (x)=>{return [ x[0], x[3] ]}
				break;
			default:
				throw(`Format ${this.format} not recognized!`)
		}

		// use the transform function to reorganize image data
		var out = []
		for (let p = 0; p < x.length; p += 4) {
			let pixelSet = [ x[p], x[p+1], x[p+2], x[p+3] ]
			out = out.concat(transform( pixelSet ))
		}
		return out
	}

	getMipmap(index,frame) {
		var tCanv = document.createElement('CANVAS')
		tCanv.width = this.images[0].width/(2**(index-1))
		tCanv.height = this.images[0].height/(2**(index-1))
		var tCtx = tCanv.getContext('2d')
		tCtx.drawImage(this.images[frame],0,0,tCanv.width,tCanv.height)
		return tCtx.getImageData(0,0,tCanv.width,tCanv.height).data
	}

	formatIndex(x) {
		const formats = {
			'RGBA8888': 0,
			'RGB888': 2,
			'I8': 5,
			'IA88': 6,
			'A8': 8,
			'DXT1': 13,
			'DXT3': 14,
			'DXT5': 15
		}
		if (formats[x] != undefined) {return formats[x]}
		else {return null}
	}
}
