import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// The acting role is derived from the server-side account role and cannot be
// changed from the client. Platform admin accounts are the pharmacist
// accounts; everyone else acts as nurse.
export function useRole() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((me) => active && setRole(me?.role === "admin" ? "pharmacist" : "nurse"))
      .catch(() => active && setRole("nurse"));
    return () => {
      active = false;
    };
  }, []);
  return { role: role || "nurse" };
}

export function useProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    base44.auth
      .me()
      .then((me) => setProfile({ name: me?.profile_name || "", regNo: me?.registration_number || "" }))
      .catch(() => setProfile({ name: "", regNo: "" }));
  }, []);
  return profile;
}