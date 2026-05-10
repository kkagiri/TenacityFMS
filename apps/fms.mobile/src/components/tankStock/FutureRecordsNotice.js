/**
 * File: FutureRecordsNotice.js
 * Purpose: Render mobile feedback for historical-entry validation, including loading, warning, and confirmation states.
 * Dependencies: React Native
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - FutureRecordsNotice(): Displays the current future-record validation state and optional action buttons
 */
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const TONE_STYLES = {
    info: {
        backgroundColor: '#eff6ff',
        borderColor: '#93c5fd',
        titleColor: '#1d4ed8',
        textColor: '#1e3a8a',
        buttonColor: '#2563eb',
    },
    warning: {
        backgroundColor: '#fffbeb',
        borderColor: '#fcd34d',
        titleColor: '#b45309',
        textColor: '#92400e',
        buttonColor: '#d97706',
    },
    error: {
        backgroundColor: '#fef2f2',
        borderColor: '#fca5a5',
        titleColor: '#b91c1c',
        textColor: '#991b1b',
        buttonColor: '#dc2626',
    },
    success: {
        backgroundColor: '#ecfdf5',
        borderColor: '#86efac',
        titleColor: '#15803d',
        textColor: '#166534',
        buttonColor: '#16a34a',
    },
};

const FutureRecordsNotice = ({
    isValidating,
    validationResult,
    validationError,
    onConfirm,
    onCancel,
}) => {
    if (isValidating) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Validating ledger impact for the selected time...</Text>
            </View>
        );
    }

    if (validationError) {
        const tone = TONE_STYLES.error;
        return (
            <View style={[styles.container, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
                <Text style={[styles.title, { color: tone.titleColor }]}>Historical Entry Validation</Text>
                <Text style={[styles.message, { color: tone.textColor }]}>{validationError}</Text>
            </View>
        );
    }

    if (!validationResult?.config?.showWarning) {
        return null;
    }

    const tone = TONE_STYLES[validationResult.config.tone] || TONE_STYLES.info;
    const title = validationResult.config.blockSubmission
        ? 'Entry Blocked'
        : validationResult.config.requiresConfirmation
            ? 'Confirmation Required'
            : 'Ledger Recalculation Notice';

    return (
        <View style={[styles.container, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
            <Text style={[styles.title, { color: tone.titleColor }]}>{title}</Text>
            <Text style={[styles.message, { color: tone.textColor }]}>{validationResult.formattedMessage}</Text>
            {validationResult.detailedWarning ? (
                <Text style={[styles.details, { color: tone.textColor }]}>{validationResult.detailedWarning}</Text>
            ) : null}
            {validationResult.config.recommendedAction ? (
                <Text style={[styles.recommendation, { color: tone.textColor }]}>{validationResult.config.recommendedAction}</Text>
            ) : null}
            <View style={styles.actions}>
                {validationResult.config.requiresConfirmation ? (
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: tone.buttonColor }]}
                        onPress={onConfirm}
                    >
                        <Text style={styles.primaryButtonText}>Proceed Anyway</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onCancel}
                >
                    <Text style={styles.secondaryButtonText}>
                        {validationResult.config.blockSubmission ? 'Dismiss' : 'Cancel'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    loadingText: {
        marginLeft: 10,
        color: '#1e3a8a',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
    details: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
    },
    recommendation: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    primaryButton: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginLeft: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    secondaryButton: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default FutureRecordsNotice;