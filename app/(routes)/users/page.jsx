// app/users/page.js
import { createClient } from "../../../lib/supabase/server";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = null;
  let userId = null;

  if (user) {
    const { data: currentUser, error } = await supabase
      .from("users")
      .select("role, user_id")
      .eq("user_id", user.id)
      .single();

    if (!error && currentUser) {
      userRole = currentUser.role;
      userId = currentUser.user_id;
    }
  }

  return (
    <UsersClient
      isAuthenticated={!!user}
      userRole={userRole}
      userId={userId}
    />
  );
}