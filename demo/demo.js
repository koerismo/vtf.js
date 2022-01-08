/* Import module objects. */
import { saveAs } from "https://cdn.skypack.dev/save-as@0.1.8";
import { Vtf, Frame, VtfImageResource, Color } from '../dist/module/VtfContainer.js';
import { VtfDxtEncodings } from "../dist/module/VtfDxtEncodings.js";
import "./../dist/module/Main.js";

/* Reveal module imports to console. Don't do this in production! */
globalThis.saveAs = saveAs;
globalThis.Vtf = Vtf;
globalThis.Frame = Frame;
globalThis.VtfImageResource = VtfImageResource;
globalThis.VtfDxtEncodings = VtfDxtEncodings;
globalThis.Color = Color;

/* Create an image object, and load data into it when files are uploaded. */
const i = document.querySelector('#inp');
globalThis.img = new Image();
document.body.appendChild(img);
i.oninput = () => {
	const fr = new FileReader();
	fr.onload = () => { img.src = fr.result; }
	fr.readAsDataURL(i.files[0]);
}