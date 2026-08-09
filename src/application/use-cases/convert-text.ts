import { convertText as runConversion } from "@/domain/conversion/convert-text";
import type {
  ConversionDirection,
  ConversionResult,
} from "@/domain/conversion/types";
import type { LegacyEncodingId } from "@/domain/typing/typing-profiles";

export interface ConvertTextRequest {
  readonly input: string;
  readonly direction: ConversionDirection;
  readonly profile?: LegacyEncodingId;
}

export function convertText(request: ConvertTextRequest): ConversionResult {
  if (request.profile && request.profile !== "krutidev-010") {
    throw new Error(`Legacy conversion profile ${request.profile} is not verified.`);
  }
  return runConversion(request.input, request.direction);
}
