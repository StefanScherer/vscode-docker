/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import Handlebars = require('handlebars');
import * as path from 'path';
import * as vscode from 'vscode';
import { MessageItem, Progress } from 'vscode';
import { AzureWizardExecuteStep, DialogResponses, UserCancelledError } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../localize';
import { pathNormalize } from '../../utils/pathNormalize';
import { Platform, PlatformOS } from '../../utils/platform';
import { ScaffoldedFileType, ScaffoldingWizardContext, ServiceInfo } from './ScaffoldingWizardContext';

Handlebars.registerHelper('workspaceRelative', (wizardContext: ScaffoldingWizardContext, absolutePath: string, platform: PlatformOS = 'Linux') => {
    const workspaceFolder: vscode.WorkspaceFolder = wizardContext.workspaceFolder;

    return pathNormalize(
        path.relative(workspaceFolder.uri.fsPath, absolutePath),
        platform
    );
});

Handlebars.registerHelper('eq', (a: string, b: string) => {
    return a === b;
});

Handlebars.registerHelper('basename', (a: string) => {
    return path.basename(a);
});

Handlebars.registerHelper('dirname', (a: string, platform: PlatformOS = 'Linux') => {
    return pathNormalize(
        path.dirname(a),
        platform
    );
});

Handlebars.registerHelper('toQuotedArray', (arr: string[]) => {
    return `[${arr.map(a => `"${a}"`).join(', ')}]`;
});

Handlebars.registerHelper('isRootPort', (ports: number[]) => {
    return ports?.some(p => p < 1024);
});

Handlebars.registerHelper('join', (a: never[] | undefined, b: never[] | undefined) => {
    if (!a) {
        return b;
    } else if (!b) {
        return a;
    } else {
        return a.concat(b);
    }
});

Handlebars.registerHelper('getComposeServiceContents', async (service: ServiceInfo, debug: boolean) => {
    const inputPath = await getInputPath(debug ? 'docker-compose.debug.service' : 'docker-compose.service', service.platform);
    const input = await fse.readFile(inputPath, 'utf-8');
    const template = Handlebars.compile(input);

    return template(service);
});

export class ScaffoldFileStep extends AzureWizardExecuteStep<ScaffoldingWizardContext> {
    public constructor(private readonly fileType: ScaffoldedFileType, public readonly priority: number) {
        super();
    }

    public async execute(wizardContext: ScaffoldingWizardContext, progress: Progress<{ message?: string; increment?: number; }>): Promise<void> {
        progress.report({ message: localize('vscode-docker.scaffold.scaffoldFileStep.progress', 'Creating \'{0}\'...', this.fileType) });

        // If this is scaffolding for a specific service we need the platform;
        // Otherwise it is scaffolding for compose all-up and it is not needed
        const platform: Platform | undefined = (wizardContext as ServiceInfo).platform;
        const inputPath = await getInputPath(this.fileType, platform);

        if (!inputPath) {
            // If there's no template, skip
            return;
        }

        const outputPath = await this.getOutputPath(wizardContext);

        const input = await fse.readFile(inputPath, 'utf-8');
        const template = Handlebars.compile(input);

        const output = template(wizardContext);

        await this.promptForOverwriteIfNeeded(wizardContext, output, outputPath);

        await fse.writeFile(outputPath, output, { encoding: 'utf-8' });
    }

    public shouldExecute(wizardContext: ScaffoldingWizardContext): boolean {
        // If this step is created it always need to be executed
        return true;
    }

    private async getOutputPath(wizardContext: ScaffoldingWizardContext): Promise<string> {
        let scaffoldFolder: string;

        if (this.fileType === 'docker-compose.yml' ||
            this.fileType === 'docker-compose.debug.yml' ||
            this.fileType === 'requirements.txt') {
            // Always at the workspace root
            scaffoldFolder = wizardContext.workspaceFolder.uri.fsPath;
        } else {
            // Get the artifact or undefined
            const serviceInfo = wizardContext as Partial<ServiceInfo>;
            const artifact: string | undefined = serviceInfo.artifact;

            // If the artifact is specified and is a real file, get the containing folder; otherwise get the workspace root
            const artifactOrWorkspaceFolder = artifact && await fse.pathExists(artifact) ? path.dirname(artifact) : wizardContext.workspaceFolder.uri.fsPath;

            if (this.fileType === 'Dockerfile') {
                // Dockerfiles are always adjacent the artifact if it exists, otherwise the root.
                scaffoldFolder = artifactOrWorkspaceFolder;
            } else if (this.fileType === '.dockerignore') {
                // For .dockerignore:
                if (serviceInfo.platform === '.NET: ASP.NET Core' ||
                    serviceInfo.platform === '.NET: Core Console') {
                    // For .NET Core, it's always at the root.
                    scaffoldFolder = wizardContext.workspaceFolder.uri.fsPath;
                } else {
                    // For other platforms, it's always adjacent the Dockerfile
                    scaffoldFolder = artifactOrWorkspaceFolder;
                }
            }
        }

        if (!scaffoldFolder) {
            // Not expected, no need to localize
            throw new Error(`Unable to determine location to scaffold ${this.fileType}`);
        }

        return path.join(scaffoldFolder, this.fileType);
    }

    private async promptForOverwriteIfNeeded(wizardContext: ScaffoldingWizardContext, output: string, outputPath: string): Promise<void> {
        if (wizardContext.overwriteAll) {
            // If overwriteAll is set, no need to prompt
            return;
        } else if (!(await fse.pathExists(outputPath))) {
            // If the output file does not exist, no need to prompt
            return;
        } else {
            const existingContents = await fse.readFile(outputPath, 'utf-8');

            if (output === existingContents) {
                // If the output contents are identical, no need to prompt
                return;
            }
        }

        // Otherwise, prompt
        const prompt = localize('vscode-docker.scaffold.scaffoldFileStep.prompt', 'Do you want to overwrite \'{0}\'?', this.fileType);
        const overwrite: MessageItem = {
            title: localize('vscode-docker.scaffold.scaffoldFileStep.overwrite', 'Overwrite')
        };
        const overwriteAll: MessageItem = {
            title: localize('vscode-docker.scaffold.scaffoldFileStep.overwriteAll', 'Overwrite All')
        };

        const response = await ext.ui.showWarningMessage(prompt, overwriteAll, overwrite, DialogResponses.cancel);

        // Throw if the response is Cancel (Escape / X will throw above)
        if (response === DialogResponses.cancel) {
            throw new UserCancelledError();
        } else if (response === overwriteAll) {
            wizardContext.overwriteAll = true;
        }
    }
}

async function getInputPath(fileName: string, platform: Platform | undefined): Promise<string> {
    const config = vscode.workspace.getConfiguration('docker');
    const settingsTemplatesPath = config.get<string | undefined>('scaffolding.templatePath', undefined);
    const defaultTemplatesPath = path.join(ext.context.asAbsolutePath('resources'), 'templates');

    let subPath: string;
    let scanDepth = 1;
    switch (platform) {
        case 'Node.js':
            subPath = path.join('node', `${fileName}.template`);
            break;
        case '.NET: ASP.NET Core':
        case '.NET: Core Console':
            subPath = path.join('netCore', `${fileName}.template`);
            break;
        case 'Python: Django':
        case 'Python: Flask':
        case 'Python: General':
            subPath = path.join('python', `${fileName}.template`);
            break;
        case 'Java':
            subPath = path.join('java', `${fileName}.template`);
            break;
        case 'C++':
            subPath = path.join('cpp', `${fileName}.template`);
            break;
        case 'Go':
            subPath = path.join('go', `${fileName}.template`);
            break;
        case 'Ruby':
            subPath = path.join('ruby', `${fileName}.template`);
            break;
        case 'Other':
            subPath = path.join('other', `${fileName}.template`);
            break;
        default:
            scanDepth = 0;
            subPath = `${fileName}.template`;
    }

    return (settingsTemplatesPath && await scanUpwardForFile(path.join(settingsTemplatesPath, subPath), scanDepth)) ||
        await scanUpwardForFile(path.join(defaultTemplatesPath, subPath), scanDepth);
}

async function scanUpwardForFile(file: string, maxDepth: number): Promise<string> {
    const fileName = path.basename(file);
    let currentFile = file;

    for (let i = 0; i <= maxDepth; i++) {
        if (await fse.pathExists(currentFile)) {
            return currentFile;
        }

        const parentDir = path.resolve(path.join(path.dirname(currentFile), '..'));

        currentFile = path.join(parentDir, fileName);
    }

    return undefined;
}
