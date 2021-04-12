// https://developer.valvesoftware.com/wiki/Valve_Texture_Format

/*
Stupid VTF Conversion Library
by Baguettery

Code based off of documentation from VDC, TeamSpen's srctools, and sprays.tk
Only supports RGBA8888

*/


String.prototype.toBytes = function() {
	return this.split('').map((x)=>{return x.charCodeAt()})
}

Number.prototype.toBytes = function(len) {
	return Array(len).fill('').map((x,y)=>{return (this >>> y*8) & 0xFF })
}

Number.prototype.toShort = function() {
	return [this & 0xFF, (this >>> 8) & 0xFF] // I have no idea how this works, I just transcribed it from sprays.tk
}

function writeVTFHeader(isize,iargs={},iflags={}) {

	var args = {
		'w': 128,					/* Width */
		'h': 128,					/* Height */
		'frame_count': 1,	/* Number of frames */
		'frame_first': 0,	/* First frame */
		'mipmap_count':1,	/* Number of Mipmaps */
		...iargs
	}
	
	var flags = {
		'point_sampling':	0,	/* Point sampling 			(aka pixel art) */
		'trilinear_sampling':	0,	/* Trilinear sampling 	(aka mediocre sampling) */
		'anis_sampling':	0,	/* Anistrophic sampling (aka high-quality sampling) */
		'clamp_s': 		1,	/* Prevent tiling on S */
		'clamp_t': 		1,	/* Prevent tiling on T */
		'hint_dxt5':		0,	/* Used for skyboxes */
		'normalmap':		0,	/* Whether the texture is a normal map. */
		'no_mipmaps':		1,	/* Disables Mipmaps */
		'no_lod': 		1,	/* No Level Of Detail */
		'one_bit_alpha':	0,	/* One-bit alpha */
		'eight_bit_alpha':	1,	/* Eight-bit alpha */
		...iflags
	} 
	
	var flagsum = 
		0x0001 * flags.point_sampling +
		0x0002 * flags.trilinear_sampling +
		0x0004 * flags.clamp_s +
		0x0008 * flags.clamp_t +
		0x0010 * flags.anis_sampling +
		0x0020 * flags.hint_dxt5 +
		/* 0x0040 is depreciated? */
		0x0080 * flags.normalmap +
		0x0100 * flags.no_mipmaps +
		0x0200 * flags.no_lod +
		0x1000 * flags.one_bit_alpha +
		0x2000 * flags.eight_bit_alpha 

	var header = [
		...(	'VTF\0'.toBytes(4)	),	/* Beginning thing. */
		7,0,0,0,	1,0,0,0,		/* Reallllly stretched out version number, I guess. */
		64,0,0,0,				/* Header size. Taking it from sprays.tk again lmao */
		...( (args.w).toShort() ),		/* Width */
		...( (args.h).toShort() ),		/* Height */
		...( flagsum.toBytes(4) ),		/* Flags */
		1,					/* # Of frames*/
		0					/* First frame */
	]

	header = header.concat(Array(64-header.length-8).fill(0)) /* Fuck you, filling the rest of the header with 0s. */
	header = header.concat([
		args.mipmap_count, 13,	/* # Of Mipmaps,	DXT1 low-res data ID */
		0, 0,
		
		0, 0,	 /* I don't know what this does, but I'll just assume that it'll work. */
		0, 1
	])

	return header
}


function dataFromImageURL(isrc,iargs) {
	var args = {
		'w':128, //width
		'h':128, //height
		...iargs //inherit args
	}
	
	return new Promise( (resolve, reject) => { /* Since this is an async function, make a new promise to keep everything nice. */

		let canv = document.createElement('CANVAS')
		canv.width = 128, canv.height = 128
		let ctx = canv.getContext('2d')

		let img = new Image()
		img.onload = function() {
			try {ctx.drawImage(img,0,0,args.w,args.h)}
			catch(e) {reject(e)}
			resolve(ctx.getImageData(0,0,args.w,args.h))
		}
		img.src = isrc

	})
}


async function createVTF(isrc,args={},flags={}) {
	let VTFBody = await dataFromImageURL(isrc,args)
	let VTFHeader = writeVTFHeader(args,flags)
	let file = VTFHeader.concat(Array.from(VTFBody.data))
	return new Uint8Array(file)
}
