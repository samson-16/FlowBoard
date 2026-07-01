import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { WorkspaceAccessService } from '../common/services/workspace-access.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(
    userId: string,
    workspaceId: string,
    createProjectDto: CreateProjectDto,
  ) {
    await this.workspaceAccessService.requireRoles(userId, workspaceId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    return this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        workspaceId,
      },
    });
  }

  

  async findByWorkspace(userId: string, workspaceId: string) {
  await this.workspaceAccessService.getMembership(userId, workspaceId);

  return this.prisma.project.findMany({
    where: {
      workspaceId,
    },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        workspace: true,
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.workspaceAccessService.getMembership(
      userId,
      project.workspaceId,
    );

    return {
      role: membership.role,
      project,
    };
  }

  async update(
    userId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership =await this.workspaceAccessService.requireRoles(userId, project.workspaceId, [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owners and admins can update projects',
      );
    }

    return this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
      },
    });
  }

  async remove(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.workspaceAccessService.requireRoles(userId, project.workspaceId, [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
]);

    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owners and admins can delete projects',
      );
    }

    await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return {
      message: 'Project deleted successfully',
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
