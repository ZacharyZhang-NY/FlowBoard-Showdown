import { Tile } from "@carbon/react";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Tile className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </Tile>
  );
}
