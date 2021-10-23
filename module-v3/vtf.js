import './encode.js';

/**
 * @author Koerismo
 * @description A javascript library to create VTF (Valve Texture Format) files.
 * @link https://github.com/koerismo/vtf.js
*/

export const VTF_FLAGS = {
	'point_sampling':		0x0001,	/* Point sampling 			(aka pixel art) */
	'trilinear_sampling':	0x0002,	/* Trilinear sampling 		(aka mediocre sampling) */
	'anis_sampling':		0x0004,	/* Anistrophic sampling 	(aka high-quality sampling) */
	'clamp_s': 				0x0008,	/* Prevent tiling on S */
	'clamp_t': 				0x0010,	/* Prevent tiling on T */
	'hint_dxt5':			0x0020,	/* Used for skyboxes */
	'normalmap':			0x0080,	/* Whether the texture is a normal map. */
	'no_mipmaps':			0x0100,	/* Disables Mipmaps */
	'no_lod': 				0x0200,	/* No Level Of Detail */
	'one_bit_alpha':		0x0400,	/* One-bit alpha */
	'eight_bit_alpha':		0x0800,	/* Eight-bit alpha */
}

export class EncodingHandler {
	/* Handles the re-encoding of uncompressed formats. */
	static encode( data, format ) {
		
		var bpp = 0;
		var cursor = 0;
		var transform, view;

		// Define encoders.
		function addUint8( x ) { view.setUint8(cursor,x); cursor += 1; }
		function addUint16( x ) { view.setUint16(cursor,x,true); cursor += 2; }

		// Select bits/pixel and transform.
		switch(format) {
			case 'RGB888':
				bpp = 24 / 32;
				transform = (r,g,b,a) => { addUint8(r); addUint8(g); addUint8(b); }
				break;
			case 'RGBA8888':
				bpp = 32 / 32;
				transform = (r,g,b,a) => { addUint8(r); addUint8(g); addUint8(b); addUint8(a); }
				break;
			case 'RGB565':
				bpp = 16 / 32;
				transform = (r,g,b,a) => {
					addUint8( (g << 3) & 0b11100000 | (b >> 3) );
					addUint8( (r & 0b11111000) | (b >> 5) );
				}
				break;
			case 'I8':
				bpp = 8 / 32;
				transform = (r,g,b,a) => { addUint8(r); }
				break;
			case 'A8':
				bpp = 8 / 32;
				transform = (r,g,b,a) => { addUint8(a); }
				break;
		}

		// Simple input validity error checks.
		if (bpp == 0)						throw(`Format ${format} not recognized by EncodingHandler!`);
		if ((data.data.length/4) % 1 != 0)	throw('Image data is incomplete! (Must follow [r,g,b,a,r,g,b,a...].)');

		view = new DataView( new ArrayBuffer(bpp * data.data.length) );

		// Write data.
		for (let ind = 0; ind < data.data.length; ind++) {
			if ( ind%4 == 0 ) transform( data.data[ind], data.data[ind+1], data.data[ind+2], data.data[ind+3] )
		}

		// Return data as a Uint8Array.
		return new Uint8Array( view.buffer );
	}

	/* Averages the colour of all pixels in rgba data provideed. */
	static average( data ) {
		const avg = {r: 0, g: 0, b: 0}
		for (var i = 0; i < data.length; i+=4 ) {
			avg.r += data[i]
			avg.g += data[i+1]
			avg.b += data[i+2]
		}
		return [ avg.r/data.length*4, avg.g/data.length*4, avg.b/data.length*4 ]
	}

	/* Handles DXT compression. */
	static encodeDXT( data, format ) {
		return 0
	}

	static __dxtblock__( datablock ) {
		return 0
	}

	/* Retrieves the index of the format provided. */
	static index( format ) {
		// Attempt to match the provided format.
		switch(format) {
			case 'RGBA8888':	return 0;
			case 'RGB888':		return 2;
			case 'RGB565':		return 4;
			case 'I8':			return 5;
			case 'IA88':		return 6;
			case 'A8':			return 8;
			case 'DXT1':		return 13;
			case 'DXT3':		return 14;
			case 'DXT5':		return 15;
		}

		// In the case that no formats match.
		throw(`Format ${format} not recognized by EncodingHandler!`);
	}
}

export class VTF {
	constructor( frames, format, flags=[], mipmaps=1, version=1 ) {

		// Check validity of provided frames.
		frames.forEach( (frame, ind) => { if (frame.x == 0 || frame.height == 0) { throw(`Frame ${ind} is invalid!`) }} );

		// Write vars.
		this.frames  = frames;
		this.format  = format;
		this.flags   = flags;
		this.mipmaps = mipmaps;
		this.version = version;
	}

	__mipmap__( frameID, mipmapID ) {
		// Create a canvas, resize to mipmap size.
		const canvas  = document.createElement('CANVAS');
		canvas.width  = this.frames[0].width  / ( 2**(mipmapID-1) )
		canvas.height = this.frames[0].height / ( 2**(mipmapID-1) )
		
		// Write image.
		const ctx = canvas.getContext('2d')
		ctx.drawImage( this.frames[frameID], 0, 0, canvas.width, canvas.height )
		return EncodingHandler.encode( ctx.getImageData( 0, 0, canvas.width, canvas.height ), this.format )
	}

	__flagsum__() {
		var sum = 0;
		for (let flag in this.flags)
			if ( Object.keys(VTF_FLAGS).contains(this.flags[flag]) )
				sum += VTF_FLAGS[this.flags[flag]]
		return sum
	}

	__body__( mipmapCount=1 ) {

		// TODO: Fix mipmaps causing problems.

		// Create an array of mipmaps.
		var mipmaps = []
		for (let mip = mipmapCount; mip > 0; mip--)
			for (let frame = 0; frame < this.frames.length; frame++)
				mipmaps.push(this.__mipmap__( frame, mip ))

		// Determine length of output and create output target.
		const bodyLength = mipmaps.reduce( (a,b) => (a + b.length), 0 )
		const body = new Uint8Array( bodyLength )

		// Collapse all data into single output.
		var ind = 0;
		for (let mip = 0; mip < mipmaps.length; mip++) {
			for (let byte = 0; byte < mipmaps[mip].length; byte++) {
				body[ind] = mipmaps[mip][byte];
				ind += 1;
			}
		}

		return body;
	}

	__header__() {

		// TODO: Fix v7.2 VTFs causing vtfedit to hang!
		// TODO: Finish 7.3+

		const pixelAvg = EncodingHandler.average( this.frames[0].data.data )

		if ( this.version >= 3 ) { //				7.3+
			throw('7.3+ is not supported at the moment!')
			return [
				...'VTF\0'.bytes(),								//  0  4b: Signature
				7,0,0,0,										//  4  8b: Version number
				...this.version.bytes(4),
				65,0,0,0,										// 12  4b: Header size
				...this.frames[0].width.short(),				// 16  2b: Width
				...this.frames[0].height.short(),				// 18  2b: Height
				...this.__flagsum__().bytes(4),					// 20  4b: Flags
				...this.flags.length.short(),					// 24  2b: Frame count
				0,0,											// 26  2b: First frame index
				0,0,0,0,										// 28  4b: Padding

				...pixelAvg[0].float(4),						// 32 12b: Reflectivity vector
				...pixelAvg[1].float(4),
				...pixelAvg[2].float(4),

				0,0,0,0,										// 44  4b: Padding
				0,0,0,0,										// 48  4b: Bumpmap scale
				...EncodingHandler.index(this.format).bytes(4),	// 52  4b: High-res image format ID
				this.mipmaps.bytes(1),							// 56  1b: Mipmap count
				...EncodingHandler.index('DXT1').bytes(4),		// 57  4b: Low-res image format ID (Always DXT1)
				0,0,											// 61  2b: Low-res image width/height
				1,0												// 63  2b: Largest mipmap depth
																// 65
			]
		}
		else if ( this.version >= 2 ) { //			7.2+
			return [
				...'VTF\0'.bytes(),								//  0  4b: Signature
				7,0,0,0,										//  4  8b: Version number
				...this.version.bytes(4),
				65,0,0,0,										// 12  4b: Header size
				...this.frames[0].width.short(),				// 16  2b: Width
				...this.frames[0].height.short(),				// 18  2b: Height
				...this.__flagsum__().bytes(4),					// 20  4b: Flags
				...this.flags.length.short(),					// 24  2b: Frame count
				0,0,											// 26  2b: First frame index
				0,0,0,0,										// 28  4b: Padding

				...pixelAvg[0].float(4),						// 32 12b: Reflectivity vector
				...pixelAvg[1].float(4),
				...pixelAvg[2].float(4),

				0,0,0,0,										// 44  4b: Padding
				0,0,0,0,										// 48  4b: Bumpmap scale
				...EncodingHandler.index(this.format).bytes(4),	// 52  4b: High-res image format ID
				this.mipmaps.bytes(1),							// 56  1b: Mipmap count
				...EncodingHandler.index('DXT1').bytes(4),		// 57  4b: Low-res image format ID (Always DXT1)
				0,0,											// 61  2b: Low-res image width/height
				1,0												// 63  2b: Largest mipmap depth
																// 65
			]
		}
		else { //									7.1 and under
			return [
				...'VTF\0'.bytes(),								//  0 4b: Signature
				7,0,0,0,										//  4 8b: Version number
				...this.version.bytes(4),
				63,0,0,0,										// 12 4b: Header size
				...this.frames[0].width.short(),				// 16 2b: Width
				...this.frames[0].height.short(),				// 18 2b: Height
				...this.__flagsum__().bytes(4),					// 20 4b: Flags
				...this.frames.length.short(),					// 24 2b: Frame count
				0,0,											// 26 2b: First frame index
				0,0,0,0,										// 28 4b: Padding

				...pixelAvg[0].float(4),						// 32 12b: Reflectivity vector
				...pixelAvg[1].float(4),
				...pixelAvg[2].float(4),

				0,0,0,0,										// 44 4b: Padding
				0,0,0,0,										// 48 4b: Bumpmap scale
				...EncodingHandler.index(this.format).bytes(4),	// 52 4b: High-res image format ID
				this.mipmaps.bytes(1),							// 56 1b: Mipmap count
				...EncodingHandler.index('DXT1').bytes(4),		// 57 4b: Low-res image format ID (Always DXT1)
				0,0												// 61 2b: Low-res image width/height
																// 63
			]
		}
	}

	blob() {
		const body = this.__body__();
		const header = this.__header__();
		const out = new Uint8Array( header.length + body.length );

		var byte;
		for (byte = 0; byte < header.length; byte++)	out[byte] = header[byte]
		for (byte = 0; byte < body.length; byte++)		out[byte+header.length] = body[byte]
		
		return new Blob( [out] );
	}

}