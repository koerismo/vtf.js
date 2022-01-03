import { Vtf, Frame, VtfImageResource } from "./VtfContainer.js";
import { VtfEncodings } from "./VtfEncodings.js";
import { VtfDxtEncodings } from "./DxtConvert.js";

Vtf.registerCodec( VtfEncodings.RGB888 );
Vtf.registerCodec( VtfDxtEncodings.DXT1 );