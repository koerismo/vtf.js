import { Vtf, Frame, VtfImageResource } from "./VtfContainer.js";
import { VtfEncodings } from "./VtfEncodings.js";
import { VtfDxtEncodings } from "./VtfDxtEncodings.js";

Vtf.registerCodec( VtfEncodings.RGB888 );
Vtf.registerCodec( VtfEncodings.RGBA8888 );
Vtf.registerCodec( VtfDxtEncodings.DXT1 );
Vtf.registerCodec( VtfDxtEncodings.DXT5 );