import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser
} from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('workspaces/:workspaceId/projects')
  create(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(
      user.id,
      workspaceId,
      createProjectDto,
    );
  }

  @Get('workspaces/:workspaceId/projects')
  findByWorkspace(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.projectsService.findByWorkspace(user.id, workspaceId);
  }

  @Get('projects/:projectId')
  findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(user.id, projectId);
  }

  @Patch('projects/:projectId')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, projectId, updateProjectDto);
  }

  @Delete('projects/:projectId')
  remove(
    @CurrentUser() user: CurrentUserType,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.remove(user.id, projectId);
  }
}