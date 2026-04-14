"use client";
/* eslint-disable @next/next/no-img-element */

type UserAvatarProps = {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
};

export function UserAvatar({ name, image, size = "sm" }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-label={name}
      className={`flowboard-user-avatar flowboard-user-avatar--${size}`}
      data-has-image={image ? "true" : "false"}
      title={name}
    >
      {image ? <img alt={name} src={image} /> : initials}
    </span>
  );
}
