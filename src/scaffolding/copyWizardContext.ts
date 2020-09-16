/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ScaffoldingWizardContext } from './wizard/ScaffoldingWizardContext';

export function copyWizardContext<T extends ScaffoldingWizardContext>(wizardContext: Partial<T>, priorWizardContext: T | undefined): void {
    if (!priorWizardContext) {
        return;
    }

    for (const prop of Object.keys(priorWizardContext)) {
        // Skip telemetry + error handling
        if (prop === 'errorHandling' || prop === 'telemetry') {
            continue;
        }

        wizardContext[prop] = priorWizardContext[prop];
    }
}
