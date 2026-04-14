import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  size?: number;
}

export function UserAvatar({ name, size = 32 }: UserAvatarProps) {
  const initials = getInitials(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "var(--cds-button-primary)",
        color: "var(--cds-text-on-color)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
