String.prototype.bytes = function() { return (new TextEncoder).encode(this) }
Number.prototype.bytes = function(len,little=false) {
	const bytes = Array(len).fill('').map((x,y)=>{return (this >>> y*8) & 0xFF })
	if (little) { return bytes.reverse() }
	return bytes
}
Number.prototype.short = function() { return [this & 0xFF, (this >>> 8) & 0xFF] }
Number.prototype.float = function(len=4, little=true) {
	const dv = new DataView(new ArrayBuffer(len));
	dv.setFloat32( 0, this, little );
	var out = []
	for (var x = 0; x < len; x++) { out.push(dv.getUint8(x)) }
	return out
}
