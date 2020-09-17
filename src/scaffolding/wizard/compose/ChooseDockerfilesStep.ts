/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWizardOptions } from 'vscode-azureextensionui';
import { ComposeScaffoldingWizardContext } from '../ScaffoldingWizardContext';
import { TelemetryPromptStep } from '../TelemetryPromptStep';

export class ChooseDockerfilesStep extends TelemetryPromptStep<ComposeScaffoldingWizardContext> {
    public async prompt(wizardContext: ComposeScaffoldingWizardContext): Promise<void> {
        wizardContext.services = [];
        throw new Error('Method not implemented.');
    }

    public shouldPrompt(wizardContext: ComposeScaffoldingWizardContext): boolean {
        return !wizardContext.services || wizardContext.services.length === 0;
    }

    public async getSubWizard(wizardContext: ComposeScaffoldingWizardContext): Promise<IWizardOptions<ComposeScaffoldingWizardContext> | undefined> {
        // No output is expected from this but it will call the setTelemetry method
        await super.getSubWizard(wizardContext);

        return {
            promptSteps: [
                new ComposeChoosePlatformsStep(),
                new ComposeGatherInformationStep(),
            ],
        };
    }

    protected setTelemetry(wizardContext: ComposeScaffoldingWizardContext): void {
        wizardContext.telemetry.measurements.serviceCount = wizardContext.services.length;
    }
}
