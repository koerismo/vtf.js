# vtf.js
A javascript library for converting images to the Valve Texture Format

## vtf-legacy.js
Version 1.0 of vtf.js. Only supports RGBA8888.

## vtf.js
*Special thanks to [@TeamSpen210](https://github.com/TeamSpen210) for helping me develop this!*


Version 2.0 of vtf.js. Rewritten entirely, this version supports the following formats:
- RGBA16161616
- RGBA8888
- RGB888
- RGB565
- I8
- A8
- IA88
- DXT1

**Currently only supports VTF v7.2**

Importing:
```js
import { VTF, VTF_FLAGS } from 'https://cdn.jsdelivr.net/gh/koerismo/vtf.js@latest/vtf.js';
```

Usage:
```js
var myImage = new Image();
myImage.onload = () => {
	var myVTF = new VTF( [myImage], 0, 'RGBA8888', { mipmaps: 1 } );
	// Blob data can be retrieved through myVTF.blob()
}
myImage.src = ''; // REPLACE THIS WITH A DATA URL
```

**WARNING! DXT1 support is currently a work in progress, and currently introduces artifacts into the image!**

### Write Speeds
##### *Tested on Apple M1 CPU, 16gb RAM. Note: More extensive testing has yet to be done!*
| Browser | Image Size (px) | Format | Speed (s) |
| ------- | --------------- | ------ | --------- |
| Firefox | 128 | RGBA8888 | 0.064 |
| Firefox | 128 | DXT1 | 0.112 |
| Firefox | 512 | RGBA8888 | 1.104 |
| Firefox | 512 | DXT1 | 1.105 |
| Firefox | 1024 | RGBA8888 | 4.229 |
| Firefox | 1024 | DXT1 | 4.464 |

