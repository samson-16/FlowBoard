import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkspaceRole } from '../generated/prisma/client';
import { WorkspaceAccessService } from '../common/services/workspace-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
// import { taskBasicSelect } from '../common/selects/prisma.select';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async create(userId: string, projectId: string, createTaskDto: CreateTaskDto) {
    const project = await this.getProjectWithWorkspace(projectId);

    await this.workspaceAccess.getMembership(userId, project.workspaceId);

    if (createTaskDto.assigneeId) {
      await this.workspaceAccess.ensureUserIsWorkspaceMember(
        createTaskDto.assigneeId,
        project.workspaceId,
        'Assignee must be a member of this workspace',
      );
    }

    return this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        dueDate: createTaskDto.dueDate
          ? new Date(createTaskDto.dueDate)
          : undefined,
        projectId,
        assigneeId: createTaskDto.assigneeId,
      },
      select: this.taskSelect(),
    });
  }
async findByProject(
  userId: string,
  projectId: string,
  filterTasksDto: FilterTasksDto,
) {
  const project = await this.getProjectWithWorkspace(projectId);

  await this.workspaceAccess.getMembership(userId, project.workspaceId);

  const page = filterTasksDto.page ?? 1;
  const limit = filterTasksDto.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {
    projectId,
    status: filterTasksDto.status,
    priority: filterTasksDto.priority,
  };

  const [tasks, total] = await Promise.all([
    this.prisma.task.findMany({
      where,
      select: this.taskSelect(),
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    this.prisma.task.count({
      where,
    }),
  ]);

  return {
    data: tasks,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

 async findOne(userId: string, taskId: string) {
  const task = await this.prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      title: true,
      description: true,
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
      project: {
        select: {
          id: true,
          name: true,
          workspaceId: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: {
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
    },
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  const membership = await this.workspaceAccess.getMembership(
    userId,
    task.project.workspaceId,
  );

  return {
    role: membership.role,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee,
      project: {
        id: task.project.id,
        name: task.project.name,
      },
      comments: task.comments,
    },
  };
}

  async update(userId: string, taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.workspaceAccess.getMembership(userId, task.project.workspaceId);

    if (updateTaskDto.assigneeId) {
      await this.workspaceAccess.ensureUserIsWorkspaceMember(
        updateTaskDto.assigneeId,
        task.project.workspaceId,
        'Assignee must be a member of this workspace',
      );
    }

  return this.prisma.task.update({
  where: {
    id: taskId,
  },
  data: {
    title: updateTaskDto.title,
    description: updateTaskDto.description,
    status: updateTaskDto.status,
    priority: updateTaskDto.priority,
    dueDate: updateTaskDto.dueDate
      ? new Date(updateTaskDto.dueDate)
      : undefined,
    assigneeId: updateTaskDto.assigneeId,
  },
  select: this.taskSelect(),
});
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.workspaceAccess.requireRoles(userId, task.project.workspaceId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  private async getProjectWithWorkspace(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        workspace: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  
private taskSelect() {
  return {
    id: true,
    title: true,
    description: true,
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
    project: {
      select: {
        id: true,
        name: true,
      },
    },
  };
}


}