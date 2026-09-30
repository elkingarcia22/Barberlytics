import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Text } from "@/components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemaIcon } from "@/icons";

export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface AuthFieldProps {
  id: string;
  label: string;
  error?: string;
  children: (control: FieldControlProps) => React.ReactNode;
}

/** Etiqueta, control y mensaje de error enlazados por `id`. */
export function AuthField({ id, label, error, children }: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? errorId : undefined })}
      {error && (
        <Text size="xs" tone="negative" id={errorId}>
          {error}
        </Text>
      )}
    </div>
  );
}

export function FormErrorAlert({ title, description }: { title: string; description: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function BackButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-4" disabled={disabled} onClick={onClick}>
      <ThemaIcon name="arrowLeft" size="sm" />
      {label}
    </Button>
  );
}
