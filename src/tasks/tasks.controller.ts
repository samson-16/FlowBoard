import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  create(
    @CurrentUser() user: CurrentUserType,
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, projectId, createTaskDto);
  }

  @Get('projects/:projectId/tasks')
  findByProject(
    @CurrentUser() user: CurrentUserType,
    @Param('projectId') projectId: string,
    @Query() filterTasksDto: FilterTasksDto,
  ) {
    return this.tasksService.findByProject(user.id, projectId, filterTasksDto);
  }

  @Get('tasks/:taskId')
  findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOne(user.id, taskId);
  }

  @Patch('tasks/:taskId')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, taskId, updateTaskDto);
  }

  @Delete('tasks/:taskId')
  remove(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(user.id, taskId);
  }
}