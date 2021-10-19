String.prototype.bytes = function() { return (new TextEncoder).encode(this) }
Number.prototype.bytes = function(len) { return Array(len).fill('').map((x,y)=>{return (this >>> y*8) & 0xFF }) }
Number.prototype.short = function() { return [this & 0xFF, (this >>> 8) & 0xFF] }