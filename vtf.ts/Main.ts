import { Vtf } from "./VtfContainer";
import { VtfEncoders, VtfDecoders } from "./VtfEncodings";

Vtf.registerEncoder( VtfEncoders.RGB888 );
Vtf.registerEncoder( VtfEncoders.DXT1 );