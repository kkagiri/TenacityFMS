/**
 * File: PasswordPolicyGuidance.js
 * Purpose: Shared password policy guidance and validation helpers for frontend password flows.
 * Dependencies: React
 * Last Modified: 2026-04-21
 *
 * Key Functions:
 * - PasswordPolicyGuidance(): Renders the shared password policy hint block.
 * - getPasswordPolicyFailures(): Returns unmet password policy rules.
 * - getPasswordPolicyError(): Builds a consistent validation message.
 */

import React from 'react';

const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export const PASSWORD_POLICY_RULES = [
    'Use at least 6 characters.',
    'Include at least 1 uppercase letter.',
    'Include at least 1 lowercase letter.',
    'Include at least 1 special character such as !, @, #, $, or %.',
    'Numbers are optional.',
];

export const getPasswordPolicyFailures = (password) => {
    const value = String(password ?? '');
    const failures = [];

    if (value.length < 6) {
        failures.push('length');
    }

    if (!UPPERCASE_PATTERN.test(value)) {
        failures.push('uppercase');
    }

    if (!LOWERCASE_PATTERN.test(value)) {
        failures.push('lowercase');
    }

    if (!SPECIAL_CHARACTER_PATTERN.test(value)) {
        failures.push('specialCharacter');
    }

    return failures;
};

export const getPasswordPolicyError = (fieldLabel = 'Password') => (
    `${fieldLabel} must be at least 6 characters and include uppercase, lowercase, and a special character.`
);

export const passwordMatchesPolicy = (password) => getPasswordPolicyFailures(password).length === 0;

const PasswordPolicyGuidance = ({
    title = 'Password policy',
    intro = 'Use a password that follows these rules:',
    className = '',
}) => {
    const containerClassName = [
        'tw-rounded-md tw-border tw-border-[#c8c6c4] tw-bg-[#faf9f8] tw-p-3',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClassName}>
            <div className="tw-flex tw-items-start tw-gap-2">
                <i className="fa-light fa-shield-keyhole tw-mt-[1px] tw-text-[14px] tw-text-[#0078d4]" />
                <div className="tw-min-w-0">
                    <div className="tw-text-[13px] tw-font-semibold tw-text-[#201f1e]">{title}</div>
                    <p className="tw-mt-1 tw-text-[12px] tw-leading-5 tw-text-[#605e5c]">{intro}</p>
                    <ul className="tw-mt-2 tw-list-disc tw-pl-5 tw-text-[12px] tw-leading-5 tw-text-[#605e5c]">
                        {PASSWORD_POLICY_RULES.map((rule) => (
                            <li key={rule}>{rule}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PasswordPolicyGuidance;