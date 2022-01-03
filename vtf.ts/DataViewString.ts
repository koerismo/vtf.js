Object.defineProperty( DataView.prototype, 'getString', { value:
	function( byteOffset: number, byteLength: number, format='ASCII' ): String {

		const decoder = new TextDecoder( format );
		const target = new Uint8Array( byteLength );

		if ( byteOffset+byteLength > this.byteLength ) {
			throw( 'RangeError: offset is outside the bounds of the DataView' );
		}

		for ( var i=0; i<byteLength; i++ ) {
			target[i] = this.getUint8( byteOffset+i );
		}

		return decoder.decode( target );

	}
})

Object.defineProperty( DataView.prototype, 'setString', { value:
	function( byteOffset: number, value: string ): Uint8Array {

		const encoder = new TextEncoder();
		const target = new Uint8Array( value.length );

		encoder.encodeInto( value, target );

		for ( var i=0; i<value.length; i++ ) {
			this.setUint8( byteOffset+i, target[i] );
		}

		return target;

	}
})