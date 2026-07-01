import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return membership;
  }

  async requireRoles(
    userId: string,
    workspaceId: string,
    allowedRoles: WorkspaceRole[],
  ) {
    const membership = await this.getMembership(userId, workspaceId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission for this action');
    }

    return membership;
  }

  async ensureUserIsWorkspaceMember(
    userId: string,
    workspaceId: string,
    message = 'User must be a member of this workspace',
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(message);
    }

    return membership;
  }
}