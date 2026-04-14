import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return json.data as User[];
    },
  });
}
