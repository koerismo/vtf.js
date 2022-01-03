import { Vtf } from "./VtfContainer.js";
import { VtfEncodings } from "./VtfEncodings.js";
import { VtfDxtEncodings } from "./VtfDxtEncodings.js";
Vtf.registerCodec(VtfEncodings.RGB888);
Vtf.registerCodec(VtfDxtEncodings.DXT1);
