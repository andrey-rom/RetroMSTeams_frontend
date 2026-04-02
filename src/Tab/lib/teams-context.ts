import type * as microsoftTeams from "@microsoft/teams-js";

/**
 * Returns a realistic mock of the Teams app.Context object
 * for local development outside of the Teams client.
 *
 * All IDs use a deterministic "mock-" prefix so they are
 * immediately recognisable in logs and network traces.
 */
export function getMockContext(): microsoftTeams.app.Context {
  return {
    app: {
      host: {
        name: "Teams" as microsoftTeams.HostName,
        clientType: "desktop" as microsoftTeams.HostClientType,
        sessionId: "mock-host-session-001",
        ringId: "general",
      },
      locale: "en-us",
      theme: "default",
      iconPositionVertical: 0,
      osLocaleInfo: undefined,
      parentMessageId: undefined,
      userClickTime: undefined,
      userFileOpenPreference: undefined,
      appLaunchId: undefined,
    },
    page: {
      id: "home",
      frameContext: "content" as microsoftTeams.FrameContexts,
    },
    user: {
      id: "mock-user-oid-00000000-0000-0000-0000-000000000001",
      userPrincipalName: "dev.user@contoso.com",
      displayName: "Dev User",
      isCallingAllowed: true,
      isPSTNCallingAllowed: false,
      licenseType: "E5",
      loginHint: "dev.user@contoso.com",
      tenant: {
        id: "mock-tenant-00000000-0000-0000-0000-000000000001",
        teamsSku: "enterprise",
      },
    },
    channel: {
      id: "mock-channel-19:general@thread.tacv2",
      displayName: "General",
      relativeUrl: "/sites/DevTeam/General",
      membershipType: "standard" as microsoftTeams.ChannelType,
    },
    team: {
      internalId: "mock-team-internal-id",
      displayName: "Dev Team",
      type: 0 as microsoftTeams.TeamType,
      groupId: "mock-group-00000000-0000-0000-0000-000000000001",
      isArchived: false,
      userRole: 0 as microsoftTeams.UserTeamRole,
    },
  } as microsoftTeams.app.Context;
}
