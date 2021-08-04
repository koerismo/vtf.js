/* Import module objects. */
import { saveAs } from "https://cdn.skypack.dev/save-as@0.1.8";
import { VTF, VTF_FLAGS } from '../module/vtf.js';

/* Reveal module imports to console. Don't do this in production! */
window.saveAs = saveAs;
window.VTF = VTF;
window.VTF_FLAGS = VTF_FLAGS;

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
	var myVTF = new VTF( [img], VTF_FLAGS.anis_sampling, 'RGBA8888' )
	saveAs( myVTF.blob(), 'myVTF.vtf' )
*/