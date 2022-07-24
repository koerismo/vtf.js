'use strict';

/* =======================================
  Reads/writes vtf files.
======================================= */

import { JStruct } from './lib/struct.ts/src/jstruct.js';

const ST_HEAD_META = new JStruct(`< 4s [2i] i `);
const ST_HEAD_71 = new JStruct(`< [2h] i h h 4x [3f] 4x f i c i [2c] 2X `);
const ST_HEAD_72 = new JStruct(`< [2h] i h h 4x [3f] 4x f i c i [2c] h X `);
const ST_HEAD_73 = new JStruct(`< [2h] i h h 4x [3f] 4x f i c i [2c] h 3x i 8x `);
const ST_HEAD_RESOURCE = new JStruct(`> 3s < C I `);

/** Describes raw vtf header information, excluding constants. */
export class RawContainer {
	version:		[ number, number ];
	width:			number;
	height:			number;
	flag_sum:		number;
	frame_count:	number;
	first_frame:	number;
	reflectivity:	[ number, number, number ];
	bump_scale:		number;
	format:			number;
	mipmap_count:	number;
	thumb_format:	number;
	thumb_width:	number;
	thumb_height:	number;
	depth:			number;
	resources:		Array<RawResource>;

	/**
	 * Unpacks raw VTF data from an array of bytes.
	 * @param {Uint8Array} data A Uint8Array of bytes.
	 * @returns {RawContainer} The unpacked container.
	 */
	static unpack( data: Uint8Array ): RawContainer	{throw('NotImplemented')}

	/**
	 * Packs VTF data into an array of bytes.
	 * @param {RawContainer} data The unpacked dict of VTF information.
	 * @returns {Uint8Array} A Uint8Array of bytes.
	 */
	static pack( data: RawContainer ): Uint8Array	{throw('NotImplemented')}
}

/** Describes raw vtf resource information. */
export class RawResource {
	identifier:	string;
	flags:		number;
	body:		Uint8Array;
}

/** Retrieves a header struct corrosponding to the vtf version. */
function get_header_struct( ver_major: number, ver_minor: number ) {
	if (ver_major !== 7)	{throw( 'VTF version must be 7.X!' )}

	switch( ver_minor ) {
		case 0:
		case 1: return ST_HEAD_71
		case 2: return ST_HEAD_72
		case 3:
		case 4:
		case 5:
		case 6: return ST_HEAD_73
	}

	throw(`Unrecognized VTF version 7.${ver_minor}`);
}

RawContainer.unpack = function( data: Uint8Array ): RawContainer {

	// Read header meta

	const meta_length = 16;
	const self = new RawContainer();
	if ( data.length < meta_length ) {throw( `Not enough data to unpack header!` )}

	let h_sign: string,
	    h_length: number,
	    h_resource_count: number;

	[	h_sign,
		self.version,
		h_length,
	] = ST_HEAD_META.unpack(data.slice( 0, meta_length ));

	if ( h_sign != 'VTF\0' )		{throw( 'Invalid VTF signature! Signature must be VTF\\0' )};
	if ( data.length < h_length )	{throw( 'File is incomplete! Data length is less than length specified in header.' )};
	if ( self.version[1] <= 2 )		{throw( 'NotImplemented: Versions <7.3 not currently supported!' )}

	// Read rest of header

	const ST_HEAD_CURRENT = get_header_struct( ...self.version );
	const real_header_length = ST_HEAD_CURRENT.calculate_packed_length() + meta_length;
	const data_header = data.slice( meta_length, real_header_length );
		
	[	[ self.width, self.height ],
		self.flag_sum,
		self.frame_count,
		self.first_frame,
		self.reflectivity,
		self.bump_scale,
		self.format,
		self.mipmap_count,
		self.thumb_format,
		[ self.thumb_width, self.thumb_height ],
		self.depth,
		h_resource_count,
	] = ST_HEAD_CURRENT.unpack( data_header );	

	// Read resource entries

	const resource_headers = ST_HEAD_RESOURCE
		.unpack_iter(data.slice( real_header_length, real_header_length + h_resource_count*8 ))
		.sort( rhead => -rhead[2] );

	function find_next_stop( ind: number ) {
		for ( let i=ind+1; i<resource_headers.length; i++ )
			if (!( resource_headers[i][1] & 0x2 )) { return resource_headers[i][2] }
		return data.length;
	}

	self.resources = new Array( h_resource_count );
	for ( let r=0; r<h_resource_count; r++ ) {
		const ind_start = resource_headers[r][2];
		const ind_end = find_next_stop( r );
	
		const resource = new RawResource();
		[ resource.identifier, resource.flags, ] = resource_headers[r];
		if ( resource.flags & 0x2 )		resource.body = new Uint8Array(0);
		else							resource.body = data.slice( ind_start, ind_end );

		self.resources[r] = resource;
	}

	return self;
}

RawContainer.pack = function( self: RawContainer ): Uint8Array {
	
	const ST_HEAD_CURRENT	= get_header_struct( ...self.version );

	const resource_count	= self.resources.length;
	const meta_length		= 16;
	const header_length		= meta_length + ST_HEAD_CURRENT.calculate_packed_length() + resource_count*8;
	const file_length		= header_length + self.resources.reduce( (a,b)=>a+b.body.length, 0 );
	const out				= new Uint8Array( file_length );

	let pointer = 0;
	function extend( arr: Uint8Array ) {
		for ( let i=0; i<arr.length; i++ ) { out[pointer+i] = arr[i] }
		pointer += arr.length;
	}

	// Write header meta

	const meta = ST_HEAD_META.pack([
		'VTF\0',
		self.version,
		header_length,
	]);
	extend(meta);

	// Write main header

	const header = ST_HEAD_CURRENT.pack([
		[ self.width, self.height ],
		self.flag_sum,
		self.frame_count,
		self.first_frame,
		self.reflectivity,
		self.bump_scale,
		self.format,
		self.mipmap_count,
		self.thumb_format,
		[ self.thumb_width, self.thumb_height ],
		self.depth,
		resource_count,
	]);
	extend(header);

	// Write resources

	const resource_headers = new Array( resource_count );
	const resources = new Array( resource_count );
	let r_pointer = header_length;

	for ( let r=0; r<resource_count; r++ ) {
		const resource = self.resources[r];
		const has_body = +!(resource.flags & 0x2);
		const r_header = ST_HEAD_RESOURCE.pack([
			resource.identifier,
			resource.flags,
			r_pointer * has_body,
		]);

		resource_headers[r] = r_header;
		if ( !has_body ) { continue }
		r_pointer += resource.body.length;
		resources[r] = resource.body;
	}

	for ( let i=0; i<resource_count; i++ )	{
		extend(resource_headers[i])
	}
	for ( let i=0; i<resource_count; i++ )	{
		if ( resources[i] !== undefined ) { extend(resources[i]) }
	}

	return out;
}