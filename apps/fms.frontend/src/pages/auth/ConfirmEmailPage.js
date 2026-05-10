/**
 * File: ConfirmEmailPage.js
 * Purpose: Guest-facing page that completes email confirmation from the onboarding link.
 * Dependencies: React, react-router-dom, axiosInstance
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - ConfirmEmailPage(): Calls the confirm-email API and shows the result state.
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const ConfirmEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [state, setState] = useState({ loading: true, success: false, message: '' });

    useEffect(() => {
        const confirmEmail = async () => {
            const userId = searchParams.get('userId');
            const token = searchParams.get('token');

            if (!userId || !token) {
                setState({
                    loading: false,
                    success: false,
                    message: 'This confirmation link is incomplete. Please request a new confirmation email from an administrator.',
                });
                return;
            }

            try {
                const response = await axiosInstance.post('/user/confirm-email', { userId, token });
                const message = response?.data?.message || 'Email confirmed successfully. You can now sign in.';
                setState({ loading: false, success: true, message });
            } catch (error) {
                const message = error?.response?.data?.message
                    || error?.response?.data?.validationErrors?.join('; ')
                    || 'Email confirmation failed. The link may have expired or already been used.';
                setState({ loading: false, success: false, message });
            }
        };

        confirmEmail();
    }, [searchParams]);

    return (
        <div className="tw-flex tw-flex-col tw-gap-6 tw-min-w-[320px] tw-max-w-[420px] tw-py-2">
            <div className={`m365-info-banner${state.success ? ' m365-info-banner--success' : ''}`}>
                <i className={`fa-light ${state.success ? 'fa-circle-check' : 'fa-circle-info'} m365-info-banner__icon`} />
                <span className="m365-info-banner__text">
                    {state.loading ? 'Confirming your email address...' : state.message}
                </span>
            </div>

            {!state.loading && (
                <div className="tw-flex tw-flex-col tw-gap-3">
                    <Link className="m365-btn m365-btn--primary tw-inline-flex tw-items-center tw-justify-center tw-gap-2" to="/login">
                        <i className="fa-light fa-right-to-bracket" />
                        Continue to sign in
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ConfirmEmailPage;