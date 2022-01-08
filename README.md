# vtf.js
*A modular typescript-javascript library for writing images in the Valve Texture Format.*

Includes the following formats by default:
- RGBA8888
- RGB888
- RGB565
- I8
- A8
- IA88
- DXT1

Supports VTF versions `7.3` through `7.5`.

---

### Importing:
```js
import { Vtf, VtfImageResource } from 'https://cdn.jsdelivr.net/gh/koerismo/vtf.js@latest/vtf.js';
```

### Example Usage:
```js
var myImage = new Image();
myImage.onload = () => {
	var myResource = new VtfImageResource([
		new Frame( myImage )
	]);
	var myVTF = new Vtf( [myImage.width, myImage.height], [myResource], 'RGBA8888' );
	saveAs( myVTF.blob(), 'myVTF.vtf' );
}
myImage.src = ''; // REPLACE THIS WITH A DATA URL
```

#### **[See Live Demo](koerismo.github.io/vtf.js/demo/demo.html)**

---