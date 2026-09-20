import * as React from "react";
import { ArrowRight, Bell, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { THEME_PRESETS, ThemeSwatch, useTheme } from "@/themes";
import { ALL_ENTRIES, DOC_GROUPS, entriesByGroup } from "../registry";
import { routeToHash } from "../router";
import { FOUNDATION_PAGES } from "../DocsShell";

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold tracking-tight text-text-primary">{value}</p>
      <p className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.12em] text-text-muted">{label}</p>
    </div>
  );
}

function Showcase() {
  const [notify, setNotify] = React.useState(true);
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
      <Card className="magic-card-sweep magic-card-lift relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ciclo Q3 · Objetivos</CardTitle>
            <StatusBadge state="success" labels={{ success: "En curso" }} />
          </div>
          <CardDescription>Avance global del ciclo con 142 colaboradores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="resumen">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="grupos">Grupos</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">Cumplimiento</span>
              <span className="font-semibold text-text-primary">68%</span>
            </div>
            <Progress value={68} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Primario</Badge>
            <Badge variant="secondary">Secundario</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Riesgo</Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button>
              <Check /> Guardar ciclo
            </Button>
            <Button variant="outline">Cancelar</Button>
            <Button variant="ghost">
              <Sparkles /> Sugerir con IA
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="home-email">Correo de la persona responsable</Label>
              <Input id="home-email" placeholder="nombre@empresa.com" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-subtle px-3 py-2.5">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Bell className="size-4 text-primary" />
                Notificar a los líderes
              </div>
              <Switch checked={notify} onCheckedChange={setNotify} aria-label="Notificar a los líderes" />
            </div>
          </CardContent>
        </Card>
        <Alert variant="info">
          <Sparkles />
          <AlertTitle>El tema se aplica en vivo</AlertTitle>
          <AlertDescription>Cambia el color arriba a la derecha y observa cómo cada pieza sigue al primario sin tocar código.</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export function HomePage() {
  const { preset, setPreset, tokens } = useTheme();
  const groupsWithEntries = DOC_GROUPS.filter((group) => entriesByGroup(group.id).length > 0);

  return (
    <div className="cascade-enter space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface p-8 shadow-card sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-ai-mesh-agent opacity-70" aria-hidden />
        <div className="relative z-10 max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sistema de diseño UBITS</p>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
            Un solo sistema. <span className="text-ai-gradient">Los temas que necesites.</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-text-secondary sm:text-base">
            Todos los componentes del producto, con sus tokens de color, tipografía, radios y motion, documentados y
            listos para probar. Cambia el tema y cada pieza lo sigue: como en shadcn, pero con la identidad UBITS.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="lg">
              <a href={routeToHash({ kind: "group", id: "ui" })}>
                Explorar componentes <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={routeToHash({ kind: "foundation", id: "themes" })}>Ver temas</a>
            </Button>
          </div>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-1.5">
          {THEME_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              aria-label={`Aplicar tema ${item.name}`}
              aria-pressed={item.id === preset.id}
              className="rounded-full p-0.5 ring-2 ring-transparent transition-all hover:scale-110 aria-pressed:ring-primary"
            >
              <ThemeSwatch preset={item} className="size-6" />
            </button>
          ))}
          <span className="ml-2 text-[12px] text-text-muted">Tema activo: <strong className="text-text-primary">{preset.name}</strong></span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat value={ALL_ENTRIES.length} label="Componentes" />
        <Stat value={groupsWithEntries.length} label="Familias" />
        <Stat value={THEME_PRESETS.length} label="Temas" />
        <Stat value={Object.keys(tokens).length} label="Tokens por tema" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Vista en vivo</h2>
          <p className="mt-1 text-[13px] text-text-secondary">Una composición real con componentes del sistema. Todo responde al tema, al radio y al modo.</p>
        </div>
        <Showcase />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">Fundamentos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {FOUNDATION_PAGES.map((page) => (
            <a
              key={page.id}
              href={routeToHash({ kind: "foundation", id: page.id })}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3.5 shadow-card transition-colors hover:border-primary/40"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <page.icon className="size-4" />
              </span>
              <span className="text-[14px] font-medium text-text-primary">{page.label}</span>
              <ArrowRight className="ml-auto size-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">Familias de componentes</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithEntries.map((group) => {
            const count = entriesByGroup(group.id).length;
            return (
              <a
                key={group.id}
                href={routeToHash({ kind: "group", id: group.id })}
                className="magic-card-sweep magic-card-lift relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-card transition-colors hover:border-primary/40"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-text-primary">{group.label}</h3>
                    <Badge variant="neutral">{count}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{group.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
