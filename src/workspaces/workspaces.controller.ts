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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspacesService } from './workspaces.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findMyWorkspaces(@CurrentUser() user: CurrentUserType) {
    return this.workspacesService.findMyWorkspaces(user.id);
  }

  @Get(':workspaceId')
  findOne(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspacesService.findOne(user.id, workspaceId);
  }

  @Patch(':workspaceId')
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(
      user.id,
      workspaceId,
      updateWorkspaceDto,
    );
  }

  @Delete(':workspaceId')
  remove(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspacesService.remove(user.id, workspaceId);
  }

  @Post(':workspaceId/members')
  addMember(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.workspacesService.addMember(user.id, workspaceId, addMemberDto);
  }

  @Get(':workspaceId/members')
  findMembers(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspacesService.findMembers(user.id, workspaceId);
  }

  @Patch(':workspaceId/members/:memberId')
  updateMemberRole(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      user.id,
      workspaceId,
      memberId,
      updateMemberRoleDto,
    );
  }

  @Delete(':workspaceId/members/:memberId')
  removeMember(
    @CurrentUser() user: CurrentUserType,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(user.id, workspaceId, memberId);
  }
}
