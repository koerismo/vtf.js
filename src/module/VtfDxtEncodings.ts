import { VtfImageData } from "./VtfContainer.js";

export class VtfDxtEncodings {
	
	private static groupBlocks( image: ImageData ): Array<Uint8Array> {

		const grouped: Array<Uint8Array> = new Array( image.data.length / 64 );
		grouped.fill(new Uint8Array( 64 ));

		for ( var pointer = 0; pointer < image.data.length; pointer+=4 ) {

			const x = ( pointer/4 ) % image.width;
			const y = Math.floor( pointer/image.width/4 );

			const group = Math.floor(x/4) + Math.floor(y/4) * image.width/4;
			const groupPixelIndex = (x%4 + (y%4)*4) * 4;

			grouped[group][groupPixelIndex+0] = image.data[pointer+0],
			grouped[group][groupPixelIndex+1] = image.data[pointer+1],
			grouped[group][groupPixelIndex+2] = image.data[pointer+2],
			grouped[group][groupPixelIndex+3] = image.data[pointer+3];
		}

		return grouped;
	}

	private static palettizeBlock( block: Uint8Array ) {

		/* Find the two most contrasting colors. */

		var maxContrastDiff = 0;
		const duo = { a: null, b: null };

		for ( var pixA = 0; pixA < block.length; pixA += 4 ) {
			for ( var pixB = pixA; pixB < block.length; pixB += 4 ) {
				if ( pixA == pixB ) { continue }
				const colA = new Color( block[pixA], block[pixA+1], block[pixA+2] );
				const colB = new Color( block[pixB], block[pixB+1], block[pixB+2] );
				const diff = Color.diff( colA, colB );

				if ( diff >= maxContrastDiff ) {
					maxContrastDiff = diff,
							  duo.a = colA,
							  duo.b = colB;
				}
			}
		}

		/* Lerp these colors to make a 4-color palette. */

		const palette = [
			duo.a,
			Color.lerp( duo.a, duo.b, 0.333 ),
			Color.lerp( duo.a, duo.b, 0.666 ),
			duo.b
		];

		if ( duo.a.value() < duo.b.value() ) { palette.reverse() }

		const indexed = new Uint8Array( 16 );

		/* For each pixel, find the closest palette entry and index it. */

		for ( var pixel = 0; pixel < block.length; pixel += 4 ) {
			var pixelMinPaletteDiff: number = null;
			var pixelClosestResult: number = null;
			const pixelColor = new Color( block[pixel], block[pixel+1], block[pixel+2] );

			for ( var paletteEntry = 0; paletteEntry < 4; paletteEntry++ ) {

				const currentDiff = Color.diff( palette[paletteEntry], pixelColor );
				if ( currentDiff <= pixelMinPaletteDiff || pixelMinPaletteDiff == null ) {
					pixelMinPaletteDiff = currentDiff;
					pixelClosestResult = paletteEntry;
				}
			}

			pixelClosestResult = [0,2,3,1][pixelClosestResult];

			indexed[pixel/4] = pixelClosestResult;
		}

		return [ indexed, palette[0], palette[3] ];

	}


	static DXT1 = {
		name: 'DXT1',
		index: 13,
		encode: function( image: ImageData ): Uint8Array {

			/* Group pixels into 4x4 blocks. */
			const grouped = VtfDxtEncodings.groupBlocks( image );
			const target = new DataView(new ArrayBuffer( image.data.length / 8 ));
			var pointer = 0;
			
			for ( var block = 0; block < grouped.length; block++ ) {

				/* Compress pixel groups with palette */
				const [ indexed, paletteA, paletteB ] = VtfDxtEncodings.palettizeBlock( grouped[block] );

				/* Write palette */
				target.setInt16( pointer, paletteA.value(), true );
				target.setInt16( pointer+2, paletteB.value(), true );
				pointer += 4;

				/* Write pixel data */
				for ( var i = 0; i < indexed.length; i += 4 ) {
					target.setInt8( pointer, (
						(indexed[i+3] << 6 & 0b11000000) |
						(indexed[i+2] << 4 & 0b00110000) |
						(indexed[i+1] << 2 & 0b00001100) |
						(indexed[i+0] << 0 & 0b00000011)
					));
					pointer += 1;
				}
				
			}

			return new Uint8Array( target.buffer );
		},
		decode: function( data: VtfImageData ): ImageData {
			return;
		}
	}

	static DXT5 = {
		name: 'DXT5',
		index: 15,
		encode: function( image: ImageData ): Uint8Array {
			return;
		},
		decode: function( data: VtfImageData ): ImageData {
			return;
		}
	}

}


class Color {

	public r: number;
	public g: number;
	public b: number;
	public a: number;

	constructor( r:number, g:number, b:number, a:number=255 ) {
		this.r = r,
		this.g = g,
		this.b = b,
		this.a = a;
	}

	value() {
		return (
			(this.r << 8 & 0b1111100000000000) |
			(this.g << 3 & 0b0000011111100000) |
			(this.r >> 3 & 0b0000000000011111)
		)
	}

	static diff( A: Color, B: Color ) {
		return ( (B.r-A.r)**2 + (B.g-A.g)**2 + (B.b-A.b)**2 )**0.5
	}

	static lerp( A: Color, B: Color, mix:number ) {
		return new Color(
			B.r * mix + A.r * (1-mix),
			B.g * mix + A.g * (1-mix),
			B.b * mix + A.b * (1-mix)
		);
	}

}