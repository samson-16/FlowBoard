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
import {
  projectBasicSelect,
  workspaceBasicSelect,
} from '../common/selects/prisma.select';


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
  select: {
    ...projectBasicSelect,
    workspace: {
      select: workspaceBasicSelect,
    },
    _count: {
      select: {
        tasks: true,
      },
    },
  },
});
  }

  

  async findByWorkspace(userId: string, workspaceId: string) {
  await this.workspaceAccessService.getMembership(userId, workspaceId);

  const projects = await this.prisma.project.findMany({
    where: {
      workspaceId,
    },
    select: {
      ...projectBasicSelect,
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

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    tasksCount: project._count.tasks,
  }));
}

  async findOne(userId: string, projectId: string) {
  const project = await this.prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      ...projectBasicSelect,
      workspaceId: true,
      workspace: {
        select: workspaceBasicSelect,
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          tasks: true,
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
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    workspace: project.workspace,
    tasksCount: project._count.tasks,
    tasks: project.tasks,
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
