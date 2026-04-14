"use client";

import { useState, useEffect } from "react";
import { Tile, Loading, InlineNotification } from "@carbon/react";
import { useProjects } from "@/hooks/use-projects";
import { BurndownChart } from "@/components/reports/BurndownChart";
import { VelocityChart } from "@/components/reports/VelocityChart";
import { DistributionChart } from "@/components/reports/DistributionChart";
import { PriorityChart } from "@/components/reports/PriorityChart";
import { CumulativeFlowChart } from "@/components/reports/CumulativeFlowChart";

export default function ReportsPage() {
  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id;
  const [burndown, setBurndown] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [priority, setPriority] = useState<any>(null);
  const [cumulative, setCumulative] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/v1/projects/${projectId}/reports/burndown`).then((r) => r.json()),
      fetch(`/api/v1/projects/${projectId}/reports/velocity`).then((r) => r.json()),
      fetch(`/api/v1/projects/${projectId}/reports/distribution`).then((r) => r.json()),
      fetch(`/api/v1/projects/${projectId}/reports/priority`).then((r) => r.json()),
      fetch(`/api/v1/projects/${projectId}/reports/cumulative`).then((r) => r.json()),
    ])
      .then(([b, v, d, p, c]) => {
        setBurndown(b.data);
        setVelocity(v.data);
        setDistribution(d.data);
        setPriority(p.data);
        setCumulative(c.data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load reports");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  if (loading || !projectId) return <Loading />;

  const burndownData = burndown?.dates?.map((date: string, idx: number) => ({
    group: "Ideal",
    date,
    value: burndown.ideal[idx],
  })) || [];
  const burndownActual = burndown?.dates?.map((date: string, idx: number) => ({
    group: "Actual",
    date,
    value: burndown.actual[idx],
  })) || [];

  const velocityData = velocity?.flatMap((item: any) => [
    { group: "Completed", key: item.sprint, value: item.completed },
    { group: "Committed", key: item.sprint, value: item.committed },
  ]) || [];

  return (
    <div>
      <h1 className="cds--type-productive-heading-05" style={{ marginBottom: "1.5rem" }}>
        Reports
      </h1>

      {error && (
        <InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton style={{ marginBottom: "1rem" }} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: "1.5rem" }}>
        <Tile>
          <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
            Burndown
          </h3>
          <div style={{ height: 300 }}>
            {mounted ? <BurndownChart data={[...burndownData, ...burndownActual]} /> : <ChartPlaceholder />}
          </div>
        </Tile>

        <Tile>
          <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
            Velocity
          </h3>
          <div style={{ height: 300 }}>
            {mounted ? <VelocityChart data={velocityData} /> : <ChartPlaceholder />}
          </div>
        </Tile>

        <Tile>
          <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
            Issue Distribution
          </h3>
          <div style={{ height: 300 }}>
            {mounted ? <DistributionChart data={distribution || []} /> : <ChartPlaceholder />}
          </div>
        </Tile>

        <Tile>
          <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
            Priority Breakdown
          </h3>
          <div style={{ height: 300 }}>
            {mounted ? <PriorityChart data={priority || []} /> : <ChartPlaceholder />}
          </div>
        </Tile>

        <Tile>
          <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
            Cumulative Flow
          </h3>
          <div style={{ height: 300 }}>
            {mounted ? <CumulativeFlowChart data={cumulative || []} /> : <ChartPlaceholder />}
          </div>
        </Tile>
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--cds-text-secondary)",
      }}
    >
      Loading chart...
    </div>
  );
}
