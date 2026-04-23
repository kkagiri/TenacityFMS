import '../../../matchMediaMock';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import IssueCompletionPopup from './IssueCompletionPopup';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

jest.mock('../../../services/issueTrackerV2Service', () => ({
    __esModule: true,
    default: {
        getWorkflowForCompletion: jest.fn(),
        completeWithActions: jest.fn(),
    },
}));

describe('IssueCompletionPopup', () => {
    const baseProps = {
        visible: true,
        onHide: jest.fn(),
        onComplete: jest.fn(),
        issueId: 42,
        issueTemplateId: 7,
        isProcessing: false,
        vehicles: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders compact mode for a single-stage general workflow', async () => {
        issueTrackerV2Service.getWorkflowForCompletion.mockResolvedValue({
            id: 1,
            issueTemplateId: 7,
            stages: [
                {
                    id: 11,
                    name: 'Complete',
                    color: '#0078d4',
                    actions: [
                        {
                            id: 100,
                            name: 'Close issue',
                            actionType: 'General',
                            description: 'General completion step',
                        },
                    ],
                },
            ],
        });

        render(<IssueCompletionPopup {...baseProps} />);

        await waitFor(() => {
            expect(issueTrackerV2Service.getWorkflowForCompletion).toHaveBeenCalledWith(7);
            expect(screen.getByRole('checkbox', { name: 'Close issue' })).toBeInTheDocument();
        });

        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(document.querySelector('.fms-slide-panel')).toHaveStyle({ width: '720px' });
    });

    test('renders stage-grouped mode and blocks submit until device fields are filled', async () => {
        issueTrackerV2Service.getWorkflowForCompletion.mockResolvedValue({
            id: 2,
            issueTemplateId: 7,
            stages: [
                {
                    id: 21,
                    name: 'Diagnose',
                    color: '#0078d4',
                    actions: [
                        {
                            id: 200,
                            name: 'Replace tracker',
                            actionType: 'DeviceChange',
                            description: 'Replace the device unit',
                        },
                    ],
                },
                {
                    id: 22,
                    name: 'Verify',
                    color: '#107c10',
                    actions: [
                        {
                            id: 201,
                            name: 'Confirm install',
                            actionType: 'General',
                            description: 'General verification step',
                        },
                    ],
                },
            ],
        });

        render(<IssueCompletionPopup {...baseProps} />);

        await waitFor(() => {
            expect(screen.getByText('Diagnose')).toBeInTheDocument();
            expect(screen.getByText('Verify')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('checkbox', { name: 'Replace tracker' }));

        await waitFor(() => {
            expect(document.querySelector('.fms-slide-panel')).toHaveStyle({ width: '1000px' });
        });

        const completeButton = screen.getByRole('button', { name: /complete issue/i });
        expect(completeButton).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/root cause/i), { target: { value: 'Damaged wiring' } });
        fireEvent.change(screen.getByLabelText(/new device type/i), { target: { value: 'Tracker X' } });
        fireEvent.change(screen.getByLabelText(/new imei/i), { target: { value: '123456789012345' } });

        await waitFor(() => {
            expect(completeButton).not.toBeDisabled();
        });
    });
});