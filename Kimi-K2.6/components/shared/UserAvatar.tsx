"use client";

interface UserAvatarProps {
  name?: string | null;
  size?: number;
}

export function UserAvatar({ name, size = 24 }: UserAvatarProps) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--cds-background-inverse)",
        color: "var(--cds-text-inverse)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  );
}
