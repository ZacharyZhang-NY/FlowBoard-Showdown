import { getInitials } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  size?: "small" | "default";
};

export default function UserAvatarComponent({ name, size = "default" }: UserAvatarProps) {
  return (
    <div className={`user-avatar ${size === "small" ? "small" : ""}`}>
      {getInitials(name)}
    </div>
  );
}
