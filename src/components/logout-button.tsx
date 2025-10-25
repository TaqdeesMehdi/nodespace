"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  return (
    <Button onClick={() => authClient.signOut()}>
      Logout
    </Button>
  );
}