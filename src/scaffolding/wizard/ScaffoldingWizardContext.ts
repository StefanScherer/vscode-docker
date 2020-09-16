/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { Platform } from '../../utils/platform';

export type ScaffoldedFileType = '.dockerignore' | 'Dockerfile' | 'docker-compose.yml' | 'docker-compose.debug.yml' | 'requirements.txt';

export interface ScaffoldingWizardContext extends IActionContext {
    // Chosen by user
    scaffoldCompose?: boolean;
    workspaceFolder?: vscode.WorkspaceFolder;

    // Other properties that get calculated or set later
    overwriteAll?: boolean;
}

export interface ServiceInfo {
    // These come from user choice
    platform?: Platform;
    ports?: number[];
    debugPorts?: number[];

    // A project file (.NET Core), entrypoint file (Python), or package.json (Node). For applicable platforms, guaranteed to be defined after the prompt phase.
    artifact?: string;

    // These are calculated depending on platform, with defaults
    version?: string;
    serviceName?: string;
}

export interface ServiceScaffoldingWizardContext extends ScaffoldingWizardContext, ServiceInfo {
    // These are set at the beginning
    scaffoldType: 'all' | 'debugging';
}

export interface ComposeScaffoldingWizardContext extends ScaffoldingWizardContext {
    // These come from user choice and calculation
    services?: ServiceInfo[];
}
