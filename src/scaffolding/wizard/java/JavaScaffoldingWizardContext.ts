/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizardPromptStep, IWizardOptions } from 'vscode-azureextensionui';
import { ChoosePortsStep } from '../ChoosePortsStep';
import { ServiceScaffoldingWizardContext } from '../ScaffoldingWizardContext';
import { ChooseJavaArtifactStep } from './ChooseJavaArtifactStep';
import { JavaGatherInformationStep } from './JavaGatherInformationStep';

export interface JavaScaffoldingWizardContext extends ServiceScaffoldingWizardContext {
    relativeJavaOutputPath?: string;
}

export function getJavaSubWizardOptions(wizardContext: ServiceScaffoldingWizardContext): IWizardOptions<JavaScaffoldingWizardContext> {
    const promptSteps: AzureWizardPromptStep<JavaScaffoldingWizardContext>[] = [
        new ChooseJavaArtifactStep(),
        new ChoosePortsStep([3000]),
        new JavaGatherInformationStep(),
    ];

    return {
        promptSteps: promptSteps,
    };
}
