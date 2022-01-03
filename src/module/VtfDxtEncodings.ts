import { VtfImageData } from "./VtfContainer.js";

export class VtfDxtEncodings {
	
	static DXT1 = {
		name: 'DXT1',
		index: 13,
		encode: function( image: ImageData ): Uint8Array {
			return;
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