/**
 * File: EmailRecipientsInput.js
 * Purpose: Reusable chip-based email recipient input with system-user search/autocomplete.
 *          Extracted from RequestReportEmailPanel so other features (e.g. warning letters)
 *          can reuse the same UX. Stores recipients as a comma-separated string via the
 *          `value`/`onChange` props for easy form integration.
 * Dependencies: redux user slice (fetchUsers), Font Awesome
 * Last Modified: 2026-04-07
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../redux/actions/userActions';
import './EmailRecipientsInput.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const splitValue = (value) =>
    (value || '')
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.length > 0);

const EmailRecipientsInput = ({ value, onChange, disabled = false, placeholder }) => {
    const dispatch = useDispatch();
    const systemUsers = useSelector((state) => state.user?.users || []);
    const currentUser = useSelector((state) => state.auth?.user);

    const [recipients, setRecipients] = useState(() => splitValue(value));
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Re-sync from external value prop changes (e.g. when loading existing letter)
    useEffect(() => {
        const next = splitValue(value);
        setRecipients((prev) => (prev.join(',') === next.join(',') ? prev : next));
    }, [value]);

    // Load users list on mount if empty
    useEffect(() => {
        if (systemUsers.length === 0) {
            dispatch(fetchUsers());
        }
    }, [dispatch, systemUsers.length]);

    const userSuggestions = useMemo(() => {
        const list = (systemUsers || [])
            .filter((u) => {
                const email = u?.email || u?.Email;
                return email && !u?.isDeleted;
            })
            .map((u) => ({
                id: u.userId || u.id,
                name: u.userName || u.username || u.name || '',
                email: (u.email || u.Email || '').toLowerCase(),
            }));

        const currentEmail = (currentUser?.email || '').toLowerCase();
        if (currentEmail) {
            const idx = list.findIndex((u) => u.email === currentEmail);
            if (idx > 0) {
                const [cur] = list.splice(idx, 1);
                list.unshift(cur);
            } else if (idx < 0) {
                list.unshift({
                    id: currentUser.id || currentUser.Id,
                    name: currentUser.userName || currentUser.UserName || 'Me',
                    email: currentEmail,
                });
            }
        }

        return list;
    }, [systemUsers, currentUser]);

    const filteredSuggestions = useMemo(() => {
        const q = emailInput.trim().toLowerCase();
        return userSuggestions.filter((u) => {
            if (recipients.includes(u.email)) return false;
            if (!q) return true;
            return u.name.toLowerCase().includes(q) || u.email.includes(q);
        });
    }, [emailInput, userSuggestions, recipients]);

    useEffect(() => {
        if (!showSuggestions) return undefined;
        const handleClick = (e) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                inputRef.current !== e.target
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showSuggestions]);

    const emit = useCallback(
        (next) => {
            setRecipients(next);
            if (onChange) {
                onChange(next.join(','));
            }
        },
        [onChange]
    );

    const addRecipient = useCallback(
        (email) => {
            const trimmed = email.trim().toLowerCase();
            if (!trimmed) return;
            if (!EMAIL_REGEX.test(trimmed)) {
                setEmailError('Invalid email address');
                return;
            }
            if (recipients.includes(trimmed)) {
                setEmailError('Email already added');
                return;
            }
            emit([...recipients, trimmed]);
            setEmailInput('');
            setEmailError('');
            setShowSuggestions(false);
        },
        [recipients, emit]
    );

    const selectUserSuggestion = useCallback(
        (user) => {
            addRecipient(user.email);
            inputRef.current?.focus();
        },
        [addRecipient]
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
                if (emailInput.trim()) {
                    e.preventDefault();
                    addRecipient(emailInput);
                }
            }
            if (e.key === 'Backspace' && !emailInput && recipients.length > 0) {
                emit(recipients.slice(0, -1));
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        },
        [emailInput, recipients, addRecipient, emit]
    );

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            if (emailInput.trim()) {
                addRecipient(emailInput);
            }
        }, 150);
    }, [emailInput, addRecipient]);

    const removeRecipient = useCallback(
        (email) => {
            emit(recipients.filter((r) => r !== email));
        },
        [recipients, emit]
    );

    return (
        <div className="email-recipients-input">
            <div className="email-recipients-input__box">
                {recipients.length > 0 && (
                    <div className="email-recipients-input__chips">
                        {recipients.map((email) => {
                            const matchedUser = userSuggestions.find((u) => u.email === email);
                            return (
                                <div key={email} className="email-recipients-input__chip">
                                    {matchedUser ? (
                                        <span title={email}>
                                            <strong>{matchedUser.name}</strong>
                                            <span className="email-recipients-input__chip-email"> ({email})</span>
                                        </span>
                                    ) : (
                                        <span>{email}</span>
                                    )}
                                    {!disabled && (
                                        <button
                                            type="button"
                                            className="email-recipients-input__chip-remove"
                                            onClick={() => removeRecipient(email)}
                                            aria-label={`Remove ${email}`}
                                        >
                                            <i className="fa-light fa-xmark" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {!disabled && (
                    <div className="email-recipients-input__wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            className="email-recipients-input__input"
                            placeholder={
                                placeholder ||
                                (recipients.length === 0
                                    ? 'Search users or type an email...'
                                    : 'Add another...')
                            }
                            value={emailInput}
                            onChange={(e) => {
                                setEmailInput(e.target.value);
                                setEmailError('');
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            autoComplete="off"
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div className="email-recipients-input__suggestions" ref={suggestionsRef}>
                                {filteredSuggestions.slice(0, 8).map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className="email-recipients-input__suggestion"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => selectUserSuggestion(user)}
                                    >
                                        <div className="email-recipients-input__avatar">
                                            {(user.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="email-recipients-input__suggestion-info">
                                            <span className="email-recipients-input__suggestion-name">{user.name}</span>
                                            <span className="email-recipients-input__suggestion-email">{user.email}</span>
                                        </div>
                                        {currentUser && user.email === (currentUser.email || '').toLowerCase() && (
                                            <span className="email-recipients-input__badge">You</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {emailError && <p className="email-recipients-input__validation">{emailError}</p>}
            {!disabled && (
                <p className="email-recipients-input__hint">
                    Search by name or email. Press Enter to add a custom email address.
                </p>
            )}
        </div>
    );
};

export default EmailRecipientsInput;
