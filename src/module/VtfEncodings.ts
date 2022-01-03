import { VtfImageData } from "./VtfContainer.js";

export class VtfEncodings {

	static RGB888 = {
		name: 'RGB888',
		index: 2,
		encode: function( image: ImageData ): Uint8Array {

			const target = new Uint8Array( image.data.length * 3/4 )
			for ( var i=0; i<image.data.length; i+=4 ) {
				const t = i * 3/4;
				target[t+0] = image.data[i+0],
				target[t+1] = image.data[i+1],
				target[t+2] = image.data[i+2];
			}
			return target;

		},
		decode: function( vtfdata: VtfImageData ): Uint8Array {

			const target = new Uint8Array( vtfdata.data.length * 4/3 )
			for ( var i=0; i<vtfdata.data.length; i+=3 ) {
				const t = i * 4/3;
				target[t+0] = vtfdata.data[i+0],
				target[t+1] = vtfdata.data[i+1],
				target[t+2] = vtfdata.data[i+2];
			}
			return target;

		}
	}

	static RGBA8888 = {
		name: 'RGBA8888',
		index: 2,
		encode: function( image: ImageData ): Uint8Array {
			return new Uint8Array( image.data );

		},
		decode: function( vtfdata: VtfImageData ): Uint8Array {
			return vtfdata.data;
		}
	}

	static RGBA8888 = {
		name: 'RGBA8888',
		index: 2,
		encode: function( image: ImageData ): Uint8Array {
			return new Uint8Array( image.data );

		},
		decode: function( vtfdata: VtfImageData ): Uint8Array {
			return vtfdata.data;
		}
	}
}