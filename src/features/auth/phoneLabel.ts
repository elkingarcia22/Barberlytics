import { formatNational, parseE164 } from "@/components/forms";

/** «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. */
export function describePhone(phone: string): string {
  const parsed = parseE164(phone);
  if (!parsed.country) return phone;
  return `${parsed.country.dialCode} ${formatNational(parsed.national, parsed.country.groups)}`;
}
