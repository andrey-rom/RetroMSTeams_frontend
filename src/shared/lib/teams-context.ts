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
      appLaunchId: undefined,
      host: {
        clientType: "desktop" as microsoftTeams.HostClientType,
        name: "Teams" as microsoftTeams.HostName,
        ringId: "general",
        sessionId: "mock-host-session-001",
      },
      iconPositionVertical: 0,
      locale: "en-us",
      osLocaleInfo: undefined,
      parentMessageId: undefined,
      theme: "default",
      userClickTime: undefined,
      userFileOpenPreference: undefined,
    },
    channel: {
      displayName: "General",
      id: "mock-channel-19:general@thread.tacv2",
      membershipType: "standard" as microsoftTeams.ChannelType,
      relativeUrl: "/sites/DevTeam/General",
    },
    page: {
      frameContext: "content" as microsoftTeams.FrameContexts,
      id: "home",
    },
    team: {
      displayName: "Dev Team",
      groupId: "mock-group-00000000-0000-0000-0000-000000000001",
      internalId: "mock-team-internal-id",
      isArchived: false,
      type: 0 as microsoftTeams.TeamType,
      userRole: 0 as microsoftTeams.UserTeamRole,
    },
    user: {
      displayName: "Dev User",
      id: "mock-user-oid-00000000-0000-0000-0000-000000000001",
      isCallingAllowed: true,
      isPSTNCallingAllowed: false,
      licenseType: "E5",
      loginHint: "dev.user@contoso.com",
      tenant: {
        id: "mock-tenant-00000000-0000-0000-0000-000000000001",
        teamsSku: "enterprise",
      },
      userPrincipalName: "dev.user@contoso.com",
    },
  } as microsoftTeams.app.Context;
}
