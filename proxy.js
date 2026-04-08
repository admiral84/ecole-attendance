// proxy.js (في جذر المشروع - تأكد من وجود هذا الملف)
import { updateSession } from "./lib/supabase/proxy";

export default async function proxy(request) {

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};