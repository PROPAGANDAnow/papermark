type SessionCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  path: "/";
  domain?: string;
  secure: boolean;
};

export const getSessionCookieOptions = ({
  vercelUrl,
  nodeEnv,
}: {
  vercelUrl?: string;
  nodeEnv?: string;
}): {
  name: string;
  options: SessionCookieOptions;
} => {
  const secure = Boolean(vercelUrl) || nodeEnv === "production";

  return {
    name: `${secure ? "__Secure-" : ""}next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // A host-only cookie prevents deployments on custom domains from trying
      // to set an unrelated parent domain (for example .papermark.com).
      domain: undefined,
      secure,
    },
  };
};
