import * as React from "react";
import { useAppT } from "@/app/i18n";
import { SelectableRow } from "@/components/selection";
import { Text } from "@/components/typography";
import { ClientAvatar } from "../calendarShared";
import { InlineList } from "../appointmentPanel/bookingStyle";
import { CLIENT_TYPE_KEYS, type Client } from "../types";
import { SearchBox } from "./SearchBox";
import { matchClients } from "./createModel";

/**
 * Elegir el cliente en su sitio, como en «Crear cita»: buscar por nombre, celular o correo y tocarlo;
 * sin buscar salen los de más visitas. La venta sin cita lo usa con «Cliente de paso» arriba.
 */
export interface ClientPickerProps {
  clients: readonly Client[];
  selectedId: string;
  onPick: (clientId: string) => void;
  onClose: () => void;
  /** Una opción fija antes de la lista (el cliente de paso, en la venta sin cita). */
  pinned?: Client;
  /** El pie de la lista (p. ej. «Crear cliente»). */
  footer?: React.ReactNode;
}

export function ClientPicker({
  clients,
  selectedId,
  onPick,
  onClose,
  pinned,
  footer,
}: ClientPickerProps) {
  const t = useAppT();
  const [query, setQuery] = React.useState("");
  const matches = matchClients(clients, query);
  const rows = pinned && !query.trim() ? [pinned, ...matches] : matches;
  return (
    <InlineList
      title={t("calendar.create.pickClient")}
      description={
        query.trim() ? undefined : t("calendar.createV.frequentHint")
      }
      onClose={onClose}
      footer={footer}
    >
      <div className="flex flex-col gap-3">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("calendar.panel.client.searchPlaceholder")}
          autoFocus
          testId="create-client-search"
        />
        {rows.length === 0 ? (
          <Text size="sm" tone="muted" className="px-1 py-2">
            {t("calendar.panel.client.noMatch", { query: query.trim() })}
          </Text>
        ) : (
          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label={t("calendar.panel.fields.client")}
          >
            {rows.map((client) => {
              const name =
                client.type === "walkin"
                  ? t("calendar.walkInSale.walkInClient")
                  : client.name;
              return (
                <SelectableRow
                  key={client.id}
                  role="radio"
                  checked={client.id === selectedId}
                  label={name}
                  leading={<ClientAvatar client={client.type === "walkin" ? undefined : client} name={name} />}
                  onClick={() => onPick(client.id)}
                >
                  <span className="flex flex-col">
                    <Text as="span" weight="medium">
                      {name}
                    </Text>
                    <Text as="span" size="xs" tone="muted" tabular>
                      {client.type === "walkin"
                        ? t("calendar.panel.client.walkInHint")
                        : `${t(CLIENT_TYPE_KEYS[client.type])} · ${client.phone}`}
                    </Text>
                  </span>
                </SelectableRow>
              );
            })}
          </div>
        )}
      </div>
    </InlineList>
  );
}
