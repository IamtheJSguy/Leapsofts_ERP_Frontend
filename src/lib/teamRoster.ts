import type { Team, TeamMember } from '../hooks/api/useTeam';

/** A shared employee or manager appears once in a combined directory. */
export const combineTeamMembers = (teams: Team[]): TeamMember[] => {
  const users = new Map<string, TeamMember>();
  for (const team of teams) {
    for (const member of [team.managerId, ...team.members]) {
      if (member?._id && member.isActive !== false) users.set(member._id, member);
    }
  }
  return [...users.values()];
};
