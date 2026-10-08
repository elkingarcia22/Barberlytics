import * as React from "react";
import { useAppT, type AppMessageKey } from "@/app/i18n";
import { Chip } from "@/components/ai-interaction";
import { Field } from "@/components/forms";
import { ModalShell } from "@/components/overlays";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BookingPerson } from "../bookingState";
import { useBookingFlow } from "./BookingContext";

const RELATIONS: readonly AppMessageKey[] = [
  "booking.person.relation.child",
  "booking.person.relation.partner",
  "booking.person.relation.parent",
  "booking.person.relation.sibling",
  "booking.person.relation.friend",
  "booking.person.relation.other",
];
const MIN_NAME = 2;

const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * «¿Para quién es la cita?»: quien reserva, la gente que ya trajo antes (su
 * hijo, su pareja) o alguien nuevo. Así una persona agenda para la familia en
 * una sola reserva y el recordatorio le llega a ella.
 */
export function PersonPicker() {
  const t = useAppT();
  const { state, dispatch } = useBookingFlow();
  const [isAdding, setIsAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [relation, setRelation] = React.useState<string>(t(RELATIONS[0]));
  const [touched, setTouched] = React.useState(false);
  const person = state.draft?.person ?? { kind: "self" };
  const guests = state.customer?.guests ?? [];
  // Los nuevos de esta reserva también se ofrecen para la siguiente cita.
  const freshGuests = state.items
    .map((item) => item.person)
    .filter((item): item is Extract<BookingPerson, { kind: "new" }> => item.kind === "new")
    .filter((item, index, all) => all.findIndex((other) => sameName(other.name, item.name)) === index && !guests.some((guest) => sameName(guest.name, item.name)));
  const isCustom = person.kind === "new" && !freshGuests.some((item) => sameName(item.name, person.name));

  const save = () => {
    setTouched(true);
    if (name.trim().length < MIN_NAME) return;
    dispatch({ type: "setPerson", person: { kind: "new", name: name.trim(), relation } });
    setIsAdding(false);
    setName("");
    setTouched(false);
  };

  return (
    <section aria-label={t("booking.person.title")} className="flex flex-col gap-2">
      <Text size="sm" weight="medium">
        {t("booking.person.title")}
      </Text>
      <div className="flex flex-wrap gap-2">
        <Chip label={t("booking.person.self")} icon="users" selected={person.kind === "self"} onClick={() => dispatch({ type: "setPerson", person: { kind: "self" } })} />
        {guests.map((guest) => (
          <Chip
            key={guest.id}
            label={guest.relation ? `${guest.name} · ${guest.relation}` : guest.name}
            selected={person.kind === "guest" && person.guestId === guest.id}
            onClick={() => dispatch({ type: "setPerson", person: { kind: "guest", guestId: guest.id, name: guest.name, relation: guest.relation } })}
          />
        ))}
        {freshGuests.map((guest) => (
          <Chip key={guest.name} label={`${guest.name} · ${guest.relation}`} selected={person.kind === "new" && sameName(person.name, guest.name)} onClick={() => dispatch({ type: "setPerson", person: guest })} />
        ))}
        {isCustom && person.kind === "new" && <Chip label={`${person.name} · ${person.relation}`} selected />}
        <Chip label={t("booking.person.add")} icon="userAdd" tone="primary" onClick={() => setIsAdding(true)} />
      </div>

      <ModalShell
        open={isAdding}
        onOpenChange={setIsAdding}
        size="sm"
        title={t("booking.person.addTitle")}
        description={t("booking.person.addLead")}
        actions={
          <Button type="button" onClick={save}>
            {t("booking.person.save")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t("booking.person.name")} required error={touched && name.trim().length < MIN_NAME ? t("booking.person.nameError") : undefined}>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus onKeyDown={(event) => event.key === "Enter" && save()} />
          </Field>
          <Field label={t("booking.person.relation")}>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map((key) => (
                  <SelectItem key={key} value={t(key)}>
                    {t(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ModalShell>
    </section>
  );
}
