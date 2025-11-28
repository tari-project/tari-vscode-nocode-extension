import { Type } from "@tari-project/typescript-bindings";
import { HTMLInputTypeAttribute } from "react";
import { SafeParseReturnType, z, ZodFirstPartySchemaTypes } from "zod";
import { WrappedBigInt } from "./wrapped-bigint";

export enum InputControlType {
  TextBoxInput = "TextBoxInput",
  CheckBoxInput = "CheckBoxInput",
}

export class TariType {
  public props: TypeProps;

  constructor(public type: Type) {
    this.props = getTypeProps(type);
  }

  public getInputControlType(): InputControlType {
    return this.type === "Bool" ? InputControlType.CheckBoxInput : InputControlType.TextBoxInput;
  }

  public get prompt(): string {
    return getPrompt(this.type);
  }

  public get inputType(): HTMLInputTypeAttribute {
    return this.props.htmlType;
  }

  public get min(): bigint | undefined {
    return this.props.minValue;
  }

  public get max(): bigint | undefined {
    return this.props.maxValue;
  }

  public validate(data: string): SafeParseReturnType<unknown, unknown> {
    return this.props.validator.safeParse(data);
  }

  public isVoid(): boolean {
    return this.type === "Unit";
  }

  public isTuple(): boolean {
    return typeof this.type === "object" && "Tuple" in this.type;
  }

  public getTupleDetails(): [TariType?, TariType?] {
    if (typeof this.type === "object" && "Tuple" in this.type && this.type.Tuple.length === 2) {
      return [new TariType(this.type.Tuple[0]), new TariType(this.type.Tuple[1])];
    }
    return [undefined, undefined];
  }
}

function getSignedMin(bits: number): bigint {
  return -(2n ** BigInt(bits - 1));
}

function getSignedMax(bits: number): bigint {
  return 2n ** BigInt(bits - 1) - 1n;
}

function getUnsignedMax(bits: number): bigint {
  return 2n ** BigInt(bits) - 1n;
}

function getPrompt(type: Type): string {
  if (typeof type === "string") {
    return type;
  } else {
    if ("Vec" in type) {
      const innerType = getPrompt(type.Vec);
      return `Vec<${innerType}>`;
    } else if ("Tuple" in type) {
      const args = type.Tuple.map(getPrompt);
      return `Tuple<${args.join(", ")}>`;
    } else if ("Other" in type) {
      return type.Other.name;
    }
  }
  return "Invalid";
}

interface TypeProps {
  htmlType: HTMLInputTypeAttribute;
  minValue?: bigint;
  maxValue?: bigint;
  validator: ZodFirstPartySchemaTypes;
}

function getTypeProps(type: Type): TypeProps {
  let htmlType: HTMLInputTypeAttribute = "number";
  let minValue: bigint | undefined = undefined;
  let maxValue: bigint | undefined = undefined;
  let validator: ZodFirstPartySchemaTypes = z.any();

  if (typeof type === "string") {
    switch (type) {
      case "Bool":
        validator = z.boolean();
        break;
      case "I8": {
        minValue = getSignedMin(8);
        maxValue = getSignedMax(8);
        break;
      }
      case "I16": {
        minValue = getSignedMin(16);
        maxValue = getSignedMax(16);
        break;
      }
      case "I32": {
        minValue = getSignedMin(32);
        maxValue = getSignedMax(32);
        break;
      }
      case "I64": {
        minValue = getSignedMin(64);
        maxValue = getSignedMax(64);
        break;
      }
      case "I128": {
        minValue = getSignedMin(128);
        maxValue = getSignedMax(128);
        break;
      }
      case "U8": {
        minValue = 0n;
        maxValue = getUnsignedMax(8);
        break;
      }
      case "U16": {
        minValue = 0n;
        maxValue = getUnsignedMax(16);
        break;
      }
      case "U32": {
        minValue = 0n;
        maxValue = getUnsignedMax(32);
        break;
      }
      case "U64": {
        minValue = 0n;
        maxValue = getUnsignedMax(64);
        break;
      }
      case "U128": {
        minValue = 0n;
        maxValue = getUnsignedMax(128);
        break;
      }
      default:
        htmlType = "text";
    }
  } else {
    htmlType = "text";
  }

  if (minValue != null && maxValue != null) {
    validator = z
      .string()
      .refine(
        (val) => {
          try {
            BigInt(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Invalid bigint string" },
      )
      .transform((val) => BigInt(val))
      .refine((val) => val >= minValue, {
        message: `Value must be greater than or equal to ${minValue.toString()}`,
      })
      .refine((val) => val <= maxValue, {
        message: `Value must be less than or equal to ${maxValue.toString()}`,
      })
      .transform((val) => new WrappedBigInt(val));
  }

  return { htmlType, minValue, maxValue, validator };
}
