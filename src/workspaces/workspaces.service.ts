import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        description: createWorkspaceDto.description,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  async findMyWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      role: membership.role,
      workspace: membership.workspace,
    }));
  }

  async findOne(userId: string, workspaceId: string) {
    const membership = await this.getMembership(userId, workspaceId);

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        projects: true,
      },
    });

    return {
      role: membership.role,
      workspace,
    };
  }

  async update(
    userId: string,
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const membership = await this.getMembership(userId, workspaceId);

    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenException(
        'Only owners and admins can update this workspace',
      );
    }

    return this.prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        name: updateWorkspaceDto.name,
        description: updateWorkspaceDto.description,
      },
    });
  }

  async remove(userId: string, workspaceId: string) {
    const membership = await this.getMembership(userId, workspaceId);

    if (membership.role !== 'OWNER') {
      throw new ForbiddenException(
        'Only the workspace owner can delete this workspace',
      );
    }

    await this.prisma.workspace.delete({
      where: {
        id: workspaceId,
      },
    });

    return {
      message: 'Workspace deleted successfully',
    };
  }

  async addMember(
    userId: string,
    workspaceId: string,
    addMemberDto: AddMemberDto,
  ) {
    const currentMember = await this.getMembership(userId, workspaceId);

    if (!['OWNER', 'ADMIN'].includes(currentMember.role)) {
      throw new ForbiddenException(
        'Only owners and admins can add workspace members',
      );
    }

    const userToAdd = await this.prisma.user.findUnique({
      where: {
        email: addMemberDto.email,
      },
    });

    if (!userToAdd) {
      throw new NotFoundException('User with this email does not exist');
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToAdd.id,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const role = addMemberDto.role ?? WorkspaceRole.MEMBER;

    if (
      role === WorkspaceRole.OWNER &&
      currentMember.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException('Only owners can add another owner');
    }

    return this.prisma.workspaceMember.create({
      data: {
        userId: userToAdd.id,
        workspaceId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findMembers(userId: string, workspaceId: string) {
    await this.getMembership(userId, workspaceId);

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateMemberRole(
    userId: string,
    workspaceId: string,
    memberId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const currentMember = await this.getMembership(userId, workspaceId);

    if (currentMember.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owners can update member roles');
    }

    const memberToUpdate = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Workspace member not found');
    }

    if (memberToUpdate.userId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    return this.prisma.workspaceMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: updateMemberRoleDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    const currentMember = await this.getMembership(userId, workspaceId);

    if (currentMember.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owners can remove members');
    }

    const memberToRemove = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Workspace member not found');
    }

    if (memberToRemove.userId === userId) {
      throw new BadRequestException(
        'You cannot remove yourself from your own workspace',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: {
        id: memberId,
      },
    });

    return {
      message: 'Workspace member removed successfully',
    };
  }

  private async getMembership(userId: string, workspaceId: string) {
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
}
