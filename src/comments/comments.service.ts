import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { WorkspaceAccessService } from '../common/services/workspace-access.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async create(
    userId: string,
    taskId: string,
    createCommentDto: CreateCommentDto,
  ) {
    const task = await this.getTaskWithWorkspace(taskId);

    await this.workspaceAccessService.getMembership(
      userId,
      task.project.workspaceId,
    );

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId,
        userId,
      },
      select: this.commentSelect(),
    });
  }

  async findByTask(userId: string, taskId: string) {
    const task = await this.getTaskWithWorkspace(taskId);

    await this.workspaceAccessService.getMembership(
      userId,
      task.project.workspaceId,
    );

    return this.prisma.comment.findMany({
      where: {
        taskId,
      },
      select: this.commentSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const membership = await this.workspaceAccessService.getMembership(
      userId,
      comment.task.project.workspaceId,
    );

    const isCommentOwner = comment.userId === userId;
    const isWorkspaceAdmin =
      membership.role === WorkspaceRole.OWNER ||
      membership.role === WorkspaceRole.ADMIN;

    if (!isCommentOwner && !isWorkspaceAdmin) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully',
    };
  }

  private async getTaskWithWorkspace(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private commentSelect() {
    return {
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
    };
  }
}
