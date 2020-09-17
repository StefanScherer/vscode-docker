/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { localize } from '../../../localize';
import { getValidImageNameFromPath } from '../../../utils/getValidImageName';
import { ComposeScaffoldingWizardContext } from '../ScaffoldingWizardContext';
import { TelemetryPromptStep } from '../TelemetryPromptStep';

export class ComposeGatherInformationStep extends TelemetryPromptStep<ComposeScaffoldingWizardContext> {
    public async prompt(wizardContext: ComposeScaffoldingWizardContext): Promise<void> {
        for (const service of wizardContext.services) {
            if (service.serviceName) {
                continue;
            }

            if (service.Dockerfile) {
                service.serviceName = getValidImageNameFromPath(path.dirname(service.Dockerfile));
            } else {
                throw new Error(localize('vscode-docker.scaffolding.compose.composeGatherInformationStep.noServiceName', 'Unable to determine name for service {0}', JSON.stringify(service)));
            }
        }
    }

    public shouldPrompt(wizardContext: ComposeScaffoldingWizardContext): boolean {
        return wizardContext.services.some(s => !s.serviceName);
    }
}
