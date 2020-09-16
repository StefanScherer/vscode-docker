/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep } from 'vscode-azureextensionui';
import { localize } from '../localize';
import { copyWizardContext } from './copyWizardContext';
import { ChooseComposeStep } from './wizard/ChooseComposeStep';
import { ChoosePlatformStep } from './wizard/ChoosePlatformStep';
import { ChooseWorkspaceFolderStep } from './wizard/ChooseWorkspaceFolderStep';
import { ScaffoldFileStep } from './wizard/ScaffoldFileStep';
import { ComposeScaffoldingWizardContext, ServiceScaffoldingWizardContext } from './wizard/ScaffoldingWizardContext';

export async function scaffold(wizardContext: Partial<ServiceScaffoldingWizardContext>, apiInput?: ServiceScaffoldingWizardContext): Promise<void> {
    copyWizardContext(wizardContext, apiInput);
    wizardContext.scaffoldType = 'all';

    const promptSteps: AzureWizardPromptStep<ServiceScaffoldingWizardContext>[] = [
        new ChooseWorkspaceFolderStep(),
        new ChoosePlatformStep(),
        new ChooseComposeStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ServiceScaffoldingWizardContext>[] = [
        new ScaffoldFileStep('.dockerignore', 100),
        new ScaffoldFileStep('Dockerfile', 200),
    ];

    const wizard = new AzureWizard<ServiceScaffoldingWizardContext>(wizardContext as ServiceScaffoldingWizardContext, {
        promptSteps: promptSteps,
        executeSteps: executeSteps,
        title: localize('vscode-docker.scaffold.addDockerFiles', 'Add Docker Files'),
    });

    await wizard.prompt();
    await wizard.execute();

    if (wizardContext.scaffoldCompose) {
        const composeWizard = new AzureWizard<ComposeScaffoldingWizardContext>({ ...wizardContext, services: [wizardContext] } as ComposeScaffoldingWizardContext, {
            promptSteps: undefined, // No additional prompts needed
            executeSteps: [
                new ScaffoldFileStep('docker-compose.yml', 300),
                new ScaffoldFileStep('docker-compose.debug.yml', 400),
            ],
        });

        await composeWizard.execute();
    }
}
