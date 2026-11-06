import React from "react";
import { DateField } from "./DateField";
import type { DateFieldProps } from "./DateField.types";

/** Local wall-clock input; conversion to UTC happens only when saving. */
export function DateTimeField(props: Pick<DateFieldProps, "label" | "value" | "onChange">) {
  return <DateField {...props} withTime />;
}
