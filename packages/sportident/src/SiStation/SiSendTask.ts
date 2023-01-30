import * as siProtocol from '../siProtocol';
import {SiSendTaskState} from './ISiSendTask';

export class SiSendTask {
    public state: SiSendTaskState = SiSendTaskState.Queued;
    public responses: number[][] = [];
    private timeoutTimer: unknown;

    constructor(
                public message: siProtocol.SiMessage,
                public numResponses: number,
                public timeoutInMiliseconds: number,
                public onResolve: (task: SiSendTask) => void,
                public onReject: (task: SiSendTask) => void,
    ) {
        this.timeoutTimer = setTimeout(() => {
            const shouldAbortInState: {[state in SiSendTaskState]: boolean} = {
                [SiSendTaskState.Queued]: true,
                [SiSendTaskState.Sending]: true,
                [SiSendTaskState.Sent]: true,
                [SiSendTaskState.Succeeded]: false,
                [SiSendTaskState.Failed]: false,
            };
            if (!shouldAbortInState[this.state]) {
                return;
            }
            console.debug(`Timeout: ${siProtocol.prettyMessage(this.message)} (expected ${this.numResponses} responses)`, this.responses);
            this.fail();
        }, timeoutInMiliseconds);
    }

    addResponse(response: number[]): void {
        this.responses.push(response);
        if (this.responses.length === this.numResponses) {
            this.succeed();
        }
    }

    succeed(): void {
        this.state = SiSendTaskState.Succeeded;
        clearTimeout(this.timeoutTimer as Parameters<typeof clearTimeout>[0]);
        this.onResolve(this);
    }

    fail(): void {
        this.state = SiSendTaskState.Failed;
        clearTimeout(this.timeoutTimer as Parameters<typeof clearTimeout>[0]);
        this.onReject(this);
    }
}
