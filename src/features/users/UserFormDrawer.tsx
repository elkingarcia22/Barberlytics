import * as React from "react";
import { useAppT } from "@/app/i18n";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { describeError, isApiError } from "@/lib/api";
import { useCreateUser, useUpdateUser } from "./queries";
import { AREAS, AREA_KEYS, USER_ROLE_KEYS, USER_STATUS_KEYS, userInputSchema, userRoleSchema, userStatusSchema, type User, type UserInput } from "./types";

export interface UserFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Con persona se edita; sin ella se crea. */
  user?: User | null;
}

const EMPTY: UserInput = { name: "", email: "", area: "", role: "member", status: "invited" };

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-status-negative" role="alert">
      {message}
    </p>
  ) : null;
}

/**
 * Crear o editar una persona. La validación corre dos veces con el mismo
 * esquema: en el cliente (Zod) antes de enviar y en el servidor; los errores
 * por campo que devuelva el backend se pintan sobre el campo correspondiente.
 */
export function UserFormDrawer({ open, onOpenChange, user }: UserFormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* El cuerpo se monta al abrir y se desmonta al cerrar: cada apertura
            arranca con el formulario limpio sin efectos de reinicio. */}
        <UserFormBody user={user ?? null} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function UserFormBody({ user, onClose }: { user: User | null; onClose: () => void }) {
  const t = useAppT();
  const isEdit = Boolean(user);
  const create = useCreateUser();
  const update = useUpdateUser();
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<UserInput>({
    resolver: zodResolver(userInputSchema),
    defaultValues: user ? { name: user.name, email: user.email, area: user.area, role: user.role, status: user.status } : EMPTY,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (user) await update.mutateAsync({ id: user.id, input: values });
      else await create.mutateAsync(values);
      onClose();
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors : undefined;
      if (fields) {
        for (const [name, messages] of Object.entries(fields)) {
          form.setError(name as keyof UserInput, { type: "server", message: messages[0] });
        }
      }
      if (!fields) setFormError(describeError(error).description);
    }
  });

  const { errors, isSubmitting } = form.formState;

  return (
    <>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle>{isEdit ? t("users.edit") : t("users.newPerson")}</SheetTitle>
          <SheetDescription>{isEdit ? t("users.editHint") : t("users.newHint")}</SheetDescription>
        </SheetHeader>

        <form id="user-form" onSubmit={onSubmit} noValidate className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input id="user-name" data-testid="user-form-name" aria-invalid={!!errors.name} {...form.register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Correo</Label>
            <Input id="user-email" type="email" data-testid="user-form-email" aria-invalid={!!errors.email} {...form.register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-area">Área</Label>
            <Controller
              control={form.control}
              name="area"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="user-area" data-testid="user-form-area" aria-invalid={!!errors.area}>
                    <SelectValue placeholder={t("users.pickArea")} />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {t(AREA_KEYS[area])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.area?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Rol</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoleSchema.options.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(USER_ROLE_KEYS[role])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-status">Estado</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="user-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {userStatusSchema.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(USER_STATUS_KEYS[status])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </form>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" disabled={isSubmitting} data-testid="user-form-submit">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isEdit ? t("users.saveChanges") : t("users.create")}
          </Button>
        </SheetFooter>
    </>
  );
}
