import "./DataViewString";

export class Vtf {


	/* Static Component */


	private static encoders = {};
	private static decoders = {};

	static registerEncoder( encoder ) {
		this.encoders[ encoder.name ] = encoder;
	}

	static registerDecoder( decoder ) {
		this.decoders[ decoder.name ] = decoder;
	}


	/* Dynamic Component */


	private size: Array<number>;
	private frames: Array<Frame>;
	private format: string;
	private mipmaps: number;
	private version: Array<number>;
	private flags: number;

	constructor( size: Array<number>, frames=[], format='RGB888', mipmaps=1, version=[7,5], flags=0 ) {
		this.size = size;
		this.frames = frames;
		this.format = format;
		this.mipmaps = mipmaps;
		this.version = version;
		this.flags = flags;
	}

	writeHeader() {

		const headerLength = 80; // v7.3+
		const data = new DataView( new ArrayBuffer(headerLength) );

		data.setString( 0, 'VTF\0', 'ASCII' );							// Identifier

		data.setUint32( 4, this.version[0], true );						// Version[0]
		data.setUint32( 8, this.version[1], true );						// Version[1]

		data.setUint32( 12, headerLength, true );						// Header length

		data.setUint16( 16, this.size[0], true );						// Width
		data.setUint16( 18, this.size[1], true );						// Height

		data.setUint32( 22, this.flags, true );							// Flags
		data.setUint16( 24, this.frames.length, true );					// Frames
		data.setUint16( 26, 0, true );									// First frame

		// Padding[4]

		data.setFloat32( 30, 0, true );									// Reflectivity[0]
		data.setFloat32( 34, 0, true );									// Reflectivity[1]
		data.setFloat32( 38, 0, true );									// Reflectivity[2]

		// Padding[4]

		data.setFloat32( 42, 1, true );									// Bumpmap scale

		data.setUint16( 46, Vtf.encoders[this.format].index, true );	// Format id
		data.setUint8( 48, this.mipmaps );								// Mipmaps

		data.setUint16( 49, Vtf.encoders['DXT1'], true );				// Low-res format id
		data.setUint8( 51, 0 );											// Low-res width
		data.setUint8( 52, 0 );											// Low-res height

		data.setUint16( 53, 1, true );									// Image depth

		// Padding[3]

		data.setUint16( 58, 0, true );									// Resource entry count
		
		// Padding[8]

	}
}













export class Frame {

	private mipmaps: Array<Mipmap>;

	constructor( mipmaps:Array<Mipmap> ) {
		this.mipmaps = mipmaps;
	}

}


export class Mipmap {

	private data: ImageData;

	constructor( data: ImageData ) {
		this.data = data;
	}

}