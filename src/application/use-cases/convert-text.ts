import { convertText as runConversion } from "@/domain/conversion/convert-text";
import type {
  ConversionDirection,
  ConversionResult,
} from "@/domain/conversion/types";

export interface ConvertTextRequest {
  readonly input: string;
  readonly direction: ConversionDirection;
}

export function convertText(request: ConvertTextRequest): ConversionResult {
  return runConversion(request.input, request.direction);
}
