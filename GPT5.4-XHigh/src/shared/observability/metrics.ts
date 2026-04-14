type MetricCounter = {
  name: string;
  help: string;
  values: Map<string, number>;
};

function metricKey(labels?: Record<string, string>): string {
  if (!labels) {
    return "";
  }

  return Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

const counters = new Map<string, MetricCounter>();

function ensureCounter(name: string, help: string): MetricCounter {
  const existing = counters.get(name);
  if (existing) {
    return existing;
  }

  const counter = {
    name,
    help,
    values: new Map<string, number>(),
  };
  counters.set(name, counter);
  return counter;
}

export function incrementMetric(
  name: string,
  help: string,
  labels?: Record<string, string>,
): void {
  const counter = ensureCounter(name, help);
  const key = metricKey(labels);
  const current = counter.values.get(key) ?? 0;
  counter.values.set(key, current + 1);
}

export function renderMetrics(): string {
  const lines: string[] = [];

  for (const counter of counters.values()) {
    lines.push(`# HELP ${counter.name} ${counter.help}`);
    lines.push(`# TYPE ${counter.name} counter`);

    for (const [labels, value] of counter.values.entries()) {
      if (!labels) {
        lines.push(`${counter.name} ${value}`);
        continue;
      }

      const formattedLabels = labels
        .split(",")
        .map((entry) => {
          const [key, labelValue] = entry.split("=");
          return `${key}="${labelValue}"`;
        })
        .join(",");

      lines.push(`${counter.name}{${formattedLabels}} ${value}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
