import React from "react";
import { useTranslation } from "react-i18next";
import { DateField } from "./DateField";
import type { DateFieldProps } from "./DateField.types";

export function BirthDateField(props: Pick<DateFieldProps, "value" | "onChange">) {
  const { t } = useTranslation();
  return <DateField {...props} label={t("profile.dateOfBirth")} maximumDate={new Date()} />;
}
