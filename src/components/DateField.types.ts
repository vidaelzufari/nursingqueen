export interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  withTime?: boolean;
  onClear?: () => void;
}
