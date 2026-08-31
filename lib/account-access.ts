import type { User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/server";

const RALLY_ACCESS_METADATA_KEY = "rally_access";

export function hasRallyAccess(user: Pick<User, "app_metadata">) {
  return user.app_metadata?.[RALLY_ACCESS_METADATA_KEY] === true;
}

export function buildRallyAccessMetadata(
  currentMetadata: Record<string, unknown> = {},
) {
  return {
    ...currentMetadata,
    [RALLY_ACCESS_METADATA_KEY]: true,
  };
}

export async function grantRallyAccess(user: Pick<User, "id" | "app_metadata">) {
  if (hasRallyAccess(user)) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: buildRallyAccessMetadata(user.app_metadata),
  });

  if (error) {
    throw error;
  }
}
