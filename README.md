# vtf.js
A javascript library for converting images to the Valve Texture Format

## vtf-legacy.js
Version 1.0 of vtf.js. Only supports RGBA8888.

## vtf.js
*Special thanks to [@TeamSpen210](https://github.com/TeamSpen210) for helping me develop this!*


Version 3.0 of vtf.js. Rewritten entirely, this version supports the following formats:
- RGBA8888
- RGB888
- RGB565
- I8
- A8
- IA88
- ~~DXT1~~ (Not reimplemented yet.)

**Currently only supports VTF v7.1-v7.2**

Importing:
```js
import { VTF, VTF_FLAGS } from 'https://cdn.jsdelivr.net/gh/koerismo/vtf.js@latest/vtf.js';
```

Usage:
```js
var myImage = new Image();
myImage.onload = () => {
	var myVTF = new VTF( [myImage], 'RGBA8888' );
	// Blob data can be retrieved through myVTF.blob()
}
myImage.src = ''; // REPLACE THIS WITH A DATA URL
```

### Write Speeds
Write speed comparisons for v3 have not been tested.
