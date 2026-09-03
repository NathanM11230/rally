export type InviteCredentials = {
  accessToken: string;
  refreshToken: string;
};

type InviteFragmentResult =
  | { ok: true; credentials: InviteCredentials }
  | { ok: false; error: string };

export function parseInviteFragment(fragment: string): InviteFragmentResult {
  const value = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(value);
  const invitationError = params.get("error_description");

  if (invitationError) {
    return { ok: false, error: invitationError };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      error: "This invitation link is invalid or has expired. Request a new invitation.",
    };
  }

  return {
    ok: true,
    credentials: {
      accessToken,
      refreshToken,
    },
  };
}
