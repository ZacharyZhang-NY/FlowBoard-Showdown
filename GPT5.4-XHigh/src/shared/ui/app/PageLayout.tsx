"use client";

import type { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, Column, Grid } from "@carbon/react";

type PageLayoutProps = {
  breadcrumb?: Array<{ href?: string; label: string }>;
  title: string;
  description?: string;
  actions?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
};

export function PageLayout({
  breadcrumb,
  title,
  description,
  actions,
  summary,
  children,
  sidebar,
}: PageLayoutProps) {
  return (
    <Grid className="flowboard-page" fullWidth>
      <Column className="flowboard-page__hero" lg={16} md={8} sm={4}>
        {breadcrumb && breadcrumb.length > 0 ? (
          <Breadcrumb noTrailingSlash>
            {breadcrumb.map((item) => (
              item.href ? (
                <BreadcrumbItem href={item.href} key={item.label}>
                  {item.label}
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem key={item.label}>{item.label}</BreadcrumbItem>
              )
            ))}
          </Breadcrumb>
        ) : null}
        <div className="flowboard-page__title-row">
          <div>
            <h1 className="flowboard-page__title">{title}</h1>
            {description ? (
              <p className="flowboard-page__description">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flowboard-page__actions">{actions}</div> : null}
        </div>
      </Column>
      {summary ? (
        <Column className="flowboard-page__summary" lg={16} md={8} sm={4}>
          {summary}
        </Column>
      ) : null}
      <Column className="flowboard-page__main" lg={sidebar ? 10 : 16} md={8} sm={4}>
        {children}
      </Column>
      {sidebar ? (
        <Column className="flowboard-page__sidebar" lg={6} md={8} sm={4}>
          {sidebar}
        </Column>
      ) : null}
    </Grid>
  );
}
