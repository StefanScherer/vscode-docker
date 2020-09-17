/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep } from 'vscode-azureextensionui';
import { localize } from '../localize';
import { copyWizardContext } from './copyWizardContext';
import { ChooseWorkspaceFolderStep } from './wizard/ChooseWorkspaceFolderStep';
import { ChooseDockerfilesStep } from './wizard/compose/ChooseDockerfilesStep';
import { ScaffoldFileStep } from './wizard/ScaffoldFileStep';
import { ComposeScaffoldingWizardContext } from './wizard/ScaffoldingWizardContext';

export async function scaffoldCompose(wizardContext: Partial<ComposeScaffoldingWizardContext>, apiInput?: ComposeScaffoldingWizardContext): Promise<void> {
    copyWizardContext(wizardContext, apiInput);
    wizardContext.scaffoldCompose = true;

    const promptSteps: AzureWizardPromptStep<ComposeScaffoldingWizardContext>[] = [
        new ChooseWorkspaceFolderStep(),
        new ChooseDockerfilesStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ComposeScaffoldingWizardContext>[] = [
        new ScaffoldFileStep('docker-compose.yml', 300),
        new ScaffoldFileStep('docker-compose.debug.yml', 400),
    ];

    const wizard = new AzureWizard<ComposeScaffoldingWizardContext>(wizardContext as ComposeScaffoldingWizardContext, {
        promptSteps: promptSteps,
        executeSteps: executeSteps,
        title: localize('vscode-docker.scaffold.addDockerFiles', 'Add Docker Compose Files'),
    });

    await wizard.prompt();
    await wizard.execute();
}
