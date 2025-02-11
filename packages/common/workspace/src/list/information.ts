import { DebugLogger } from '@affine/debug';
import { Slot } from '@blocksuite/global/utils';

import type { WorkspaceMetadata } from '../metadata';
import type { Workspace } from '../workspace';
import type { WorkspaceListProvider } from './index';

const logger = new DebugLogger('affine:workspace:list:information');

const WORKSPACE_INFORMATION_CACHE_KEY = 'workspace-information:';

export interface WorkspaceInfo {
  avatar?: string;
  name?: string;
}

/**
 * # WorkspaceInformation
 *
 * This class take care of workspace avatar and name
 *
 * The class will try to get from 3 places:
 * - local cache
 * - fetch from `WorkspaceListProvider`, which will fetch from database or server
 * - sync with active workspace
 */
export class WorkspaceInformation {
  private _info: WorkspaceInfo = {};

  public set info(info: WorkspaceInfo) {
    if (info.avatar !== this._info.avatar || info.name !== this._info.name) {
      localStorage.setItem(
        WORKSPACE_INFORMATION_CACHE_KEY + this.meta.id,
        JSON.stringify(info)
      );
      this._info = info;
      this.onUpdated.emit(info);
    }
  }

  public get info() {
    return this._info;
  }

  public onUpdated = new Slot<WorkspaceInfo>();

  constructor(
    public meta: WorkspaceMetadata,
    public provider: WorkspaceListProvider
  ) {
    const cached = this.getCachedInformation();
    // init with cached information
    this.info = { ...cached };
  }

  /**
   * sync information with workspace
   */
  syncWithWorkspace(workspace: Workspace) {
    this.info = {
      avatar: workspace.blockSuiteWorkspace.meta.avatar ?? this.info.avatar,
      name: workspace.blockSuiteWorkspace.meta.name ?? this.info.name,
    };
    workspace.blockSuiteWorkspace.meta.commonFieldsUpdated.on(() => {
      this.info = {
        avatar: workspace.blockSuiteWorkspace.meta.avatar ?? this.info.avatar,
        name: workspace.blockSuiteWorkspace.meta.name ?? this.info.name,
      };
    });
  }

  getCachedInformation() {
    const cache = localStorage.getItem(
      WORKSPACE_INFORMATION_CACHE_KEY + this.meta.id
    );
    if (cache) {
      return JSON.parse(cache) as WorkspaceInfo;
    }
    return null;
  }

  /**
   * fetch information from provider
   */
  fetch() {
    this.provider
      .getInformation(this.meta.id)
      .then(info => {
        if (info) {
          this.info = info;
        }
      })
      .catch(err => {
        logger.warn('get workspace information error: ' + err);
      });
  }
}
