/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardPromptStep } from 'vscode-azureextensionui';
import { localize } from '../localize';
import { copyWizardContext } from './copyWizardContext';
import { ChoosePlatformStep } from './wizard/ChoosePlatformStep';
import { ChooseWorkspaceFolderStep } from './wizard/ChooseWorkspaceFolderStep';
import { ServiceScaffoldingWizardContext } from './wizard/ScaffoldingWizardContext';

export async function scaffoldDebugConfig(wizardContext: Partial<ServiceScaffoldingWizardContext>, apiInput?: ServiceScaffoldingWizardContext): Promise<void> {
    copyWizardContext(wizardContext, apiInput);
    wizardContext.scaffoldType = 'debugging';

    const promptSteps: AzureWizardPromptStep<ServiceScaffoldingWizardContext>[] = [
        new ChooseWorkspaceFolderStep(),
        new ChoosePlatformStep(['Node.js', '.NET: ASP.NET Core', '.NET: Core Console', 'Python: Django', 'Python: Flask', 'Python: General']),
    ];

    const wizard = new AzureWizard<ServiceScaffoldingWizardContext>(wizardContext as ServiceScaffoldingWizardContext, {
        promptSteps: promptSteps,
        title: localize('vscode-docker.scaffold.addDockerFiles', 'Initialize for Debugging'),
    });

    await wizard.prompt();
    await wizard.execute();
}
