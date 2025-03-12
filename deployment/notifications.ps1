# Email Notification Functions

# Function for sending email notifications
function Send-Notification {
    param (
        [string]$Subject,
        [string]$Body,
        [string]$Level = "INFO",
        [switch]$IncludeLog,
        [switch]$IsError,
        [string]$LogFile = "./deployment_log.txt"
    )

    # Use environment variable log file if it exists
    if ($env:logFile) {
        $LogFile = $env:logFile
    }

    Write-Log -Message "Sending email notification: $Subject" -Level $Level -LogFile $LogFile

    # Determine deployment type
    $deploymentType = if ($env:FRONTEND_ONLY -eq $true) {
        "Frontend Only"
    } elseif ($env:BACKEND_ONLY -eq $true) {
        "Backend Only"
    } else {
        "Full (Frontend and Backend)"
    }

    $serverName = $env:COMPUTERNAME
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $environment = $env:ENVIRONMENT

    $fullBody = @"
DEPLOYMENT NOTIFICATION
-----------------------
Type: $deploymentType
Server: $serverName
Environment: $environment
Time: $timestamp
Status: $(if ($IsError) { "FAILED" } else { "SUCCESS" })

$Body
"@

    # Include log excerpt if requested
    if ($IncludeLog -and (Test-Path $LogFile)) {
        # Get the last 20 lines from the log file
        $logExcerpt = Get-Content -Path $LogFile -Tail 20 | Out-String
        $fullBody += "`n`nLOG EXCERPT:`n--------------`n$logExcerpt"
    }

    # Send email notification
    try {
        # Allow for both naming conventions
        $emailFrom = $env:NOTIFICATION_EMAIL_FROM -or $env:EMAIL_FROM
        $emailTo = $env:NOTIFICATION_EMAIL_TO -or $env:EMAIL_TO
        $smtpServer = $env:NOTIFICATION_SMTP_SERVER -or $env:EMAIL_SMTP_SERVER
        $smtpPort = $env:NOTIFICATION_SMTP_PORT -or $env:EMAIL_SMTP_PORT
        $smtpUser = $env:NOTIFICATION_SMTP_USER -or $env:EMAIL_USERNAME
        $smtpPassword = $env:NOTIFICATION_SMTP_PASSWORD -or $env:EMAIL_PASSWORD
        $useSSL = [System.Convert]::ToBoolean($env:NOTIFICATION_SMTP_USE_SSL -or $env:EMAIL_USE_SSL)

        if (-not $emailFrom -or -not $emailTo -or -not $smtpServer) {
            Write-Log -Message "Email notification settings incomplete. Check environment variables." -Level "WARN" -LogFile $LogFile
            return
        }

        # Create email message
        $mailMessage = New-Object System.Net.Mail.MailMessage
        $mailMessage.From = $emailFrom
        foreach ($recipient in $emailTo.Split(',')) {
            $mailMessage.To.Add($recipient.Trim())
        }
        $mailMessage.Subject = $Subject
        $mailMessage.Body = $fullBody
        $mailMessage.IsBodyHtml = $false

        # Setup SMTP client
        $smtpClient = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
        $smtpClient.EnableSsl = $useSSL

        # Add credentials if provided
        if ($smtpUser -and $smtpPassword) {
            $securePassword = ConvertTo-SecureString $smtpPassword -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential($smtpUser, $securePassword)
            $smtpClient.Credentials = $credential.GetNetworkCredential()
        }

        # Send email
        $smtpClient.Send($mailMessage)
        Write-Log -Message "Email notification sent to $emailTo" -Level "INFO" -LogFile $LogFile
    }
    catch {
        Write-Log -Message "Failed to send email notification: $_" -Level "ERROR" -LogFile $LogFile
    }
}