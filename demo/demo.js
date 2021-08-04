/* Import VTF objects. */
import * as vtf from '../vtf-v2.js';
window.vtf = vtf;

/* Create an image object, and load data into it when files are uploaded. */
const i = document.querySelector('#inp');
const img = new Image();
document.body.appendChild(img);
i.oninput = () => {
	const fr = new FileReader();
	fr.onload = () => { img.src = fr.result; }
	fr.readAsDataURL(i.files[0]);
}

/*
	All of the elements from the library are duplicated into
	the window.vtf object, which can be accessed from the console.

	Example: (Be sure to upload an image prior to running this)
	var myVTF = new vtf.VTF( [img], 0, 'RGBA8888' )
*/