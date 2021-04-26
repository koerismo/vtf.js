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



class VTF {
	constructor(image, flagsum, format='RGBA8888',args={}) {
		this.image = image
		this.format = format // RGBA8888, RGB888, I8, A8, IA88, DXT1, DXT5
		this.mipmaps = args.mipmaps||1
		this.flagsum = flagsum
	}

	_toBytes(st) {}

	get header() {
		var header = [
			...(	'VTF\0'.bytes()	),	/* Beginning thing. */
			7,0,0,0,	1,0,0,0,			/* Reallllly stretched out version number, I guess. */
			64,0,0,0,						/* Header size. Taking it from sprays.tk again lmao */
			...( (this.image.width).short() ),		/* Width */
			...( (this.image.height).short() ),		/* Height */
			...( this.flagsum.bytes(4) ),				/* Flags */
			1,					/* # Of frames*/
			0					/* First frame */
		]

		header = header.concat(Array(64-header.length-8).fill(0))
		header = header.concat([
			this.mipmaps, 13,	/* # Of Mipmaps,	DXT1 low-res data ID */
			0, 0,
			
			0, 0,	 /* I don't know what this does, but I'll just assume that it'll work. */
			0, 1
		])

		return header
	}

	get body() {
		var body = []
		for (let mipmap = this.mipmaps; mipmap > 0; mipmap-=1) {
			body = body.concat( this.encode(this.getMipmap(mipmap)) )
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
				transform = (x)=>{return [ x[0] ]}
				break;
			case 'A8':
				transform = (x)=>{return [ x[3] ]}
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

	getMipmap(x) {
		var tCanv = document.createElement('CANVAS')
		tCanv.width = this.image.width/(2**(x-1))
		tCanv.height = this.image.height/(2**(x-1))
		var tCtx = tCanv.getContext('2d')
		tCtx.drawImage(this.image,0,0,tCanv.width,tCanv.height)
		return tCtx.getImageData(0,0,tCanv.width,tCanv.height).data
	}
}
