/**
 * File: EmployeeDocumentSchemaGuard.cs
 * Purpose: Ensures the employee_documents table exists before employee document operations run.
 * Dependencies: GpsdataContext, EF Core
 * Last Modified: 2026-04-15
 *
 * Key Functions:
 * - EnsureTableExistsAsync(): Creates the employee_documents table when it is missing.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Employee.Services;

public static class EmployeeDocumentSchemaGuard
{
    private static bool _tableVerified;
    private static readonly SemaphoreSlim VerificationLock = new(1, 1);

    public static async Task EnsureTableExistsAsync(
        GpsdataContext context,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        if (_tableVerified)
        {
            return;
        }

        await VerificationLock.WaitAsync(cancellationToken);

        try
        {
            if (_tableVerified)
            {
                return;
            }

            const string sql = @"
CREATE TABLE IF NOT EXISTS employee_documents (
    Id CHAR(36) NOT NULL,
    EmployeeId INT NOT NULL,
    DocumentType INT NOT NULL,
    DocumentNumber VARCHAR(100) NOT NULL,
    IssueDate DATETIME NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    AlertLeadDays INT NOT NULL DEFAULT 30,
    IssuingAuthority VARCHAR(200) NULL,
    Notes VARCHAR(1000) NULL,
    DocumentFileName VARCHAR(255) NULL,
    DocumentFileUrl VARCHAR(500) NULL,
    Status INT NOT NULL,
    CreatedAt DATETIME NOT NULL,
    CreatedBy VARCHAR(100) NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy VARCHAR(100) NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UK_employee_documents_EmployeeId_DocumentType_DocumentNumber (EmployeeId, DocumentType, DocumentNumber),
    KEY IX_employee_documents_EmployeeId (EmployeeId),
    KEY IX_employee_documents_ExpiryDate (ExpiryDate),
    KEY IX_employee_documents_DocumentType (DocumentType),
    KEY IX_employee_documents_Status (Status),
    CONSTRAINT FK_employee_documents_employee
        FOREIGN KEY (EmployeeId) REFERENCES employee (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

            await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            _tableVerified = true;
            logger?.LogInformation("EmployeeDocumentSchemaGuard: employee_documents table verified/created.");
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "EmployeeDocumentSchemaGuard: Failed to verify/create employee_documents table.");
            throw;
        }
        finally
        {
            VerificationLock.Release();
        }
    }
}