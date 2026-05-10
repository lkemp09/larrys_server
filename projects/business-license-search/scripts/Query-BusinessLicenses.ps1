param(
    [string]$DatabasePath = "C:\dev\larrys_server\data\business-licenses\BusinessLicenses.accdb",
    [string]$Search = "",
    [string]$Status = "",
    [string]$City = "",
    [string]$State = "",
    [int]$Limit = 50
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $DatabasePath)) {
    throw "Database file not found: $DatabasePath"
}

if ($Limit -lt 1) { $Limit = 1 }
if ($Limit -gt 250) { $Limit = 250 }

function Add-Param($command, $value) {
    $parameter = New-Object System.Data.OleDb.OleDbParameter("@p", [System.Data.OleDb.OleDbType]::VarWChar)
    $parameter.Value = $value
    $command.Parameters.Add($parameter) | Out-Null
}

function Read-Date($reader, $name) {
    $ordinal = $reader.GetOrdinal($name)
    if ($reader.IsDBNull($ordinal)) {
        return $null
    }

    return $reader.GetDateTime($ordinal).ToString("yyyy-MM-dd")
}

$where = New-Object System.Collections.Generic.List[string]
$parameters = New-Object System.Collections.Generic.List[string]

if (-not [string]::IsNullOrWhiteSpace($Search)) {
    $where.Add("(BusinessName LIKE ? OR Owners LIKE ? OR CStr(LicenseNumber) LIKE ? OR PhysicalLine1 LIKE ? OR MailingLine1 LIKE ?)")
    $pattern = "%$Search%"
    foreach ($i in 1..5) { $parameters.Add($pattern) }
}

if (-not [string]::IsNullOrWhiteSpace($Status)) {
    $where.Add("[Status] = ?")
    $parameters.Add($Status)
}

if (-not [string]::IsNullOrWhiteSpace($City)) {
    $where.Add("PhysicalCity LIKE ?")
    $parameters.Add("%$City%")
}

if (-not [string]::IsNullOrWhiteSpace($State)) {
    $where.Add("PhysicalState = ?")
    $parameters.Add($State)
}

$whereSql = ""
if ($where.Count -gt 0) {
    $whereSql = " WHERE " + ($where -join " AND ")
}

$connection = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$DatabasePath;")
$connection.Open()

try {
    $countCommand = $connection.CreateCommand()
    $countCommand.CommandText = "SELECT COUNT(*) FROM BusinessLicenses$whereSql"
    foreach ($value in $parameters) { Add-Param $countCommand $value }
    $total = [int]$countCommand.ExecuteScalar()

    $queryCommand = $connection.CreateCommand()
    $queryCommand.CommandText = @"
SELECT TOP $Limit
    Id, Owners, LicenseNumber, BusinessName, [Status], IssueDate, RenewDate, ExpireDate,
    HasTelemedicine, PhysicalCity, PhysicalCountry, PhysicalLine1, PhysicalLine2, PhysicalState,
    PhysicalZip, PhysicalZipPlus, MailingCity, MailingCountry, MailingLine1, MailingLine2,
    MailingState, MailingZip, MailingZipPlus
FROM BusinessLicenses$whereSql
ORDER BY BusinessName, LicenseNumber
"@
    foreach ($value in $parameters) { Add-Param $queryCommand $value }

    $reader = $queryCommand.ExecuteReader()
    $rows = New-Object System.Collections.Generic.List[object]

    while ($reader.Read()) {
        $rows.Add([ordered]@{
            id = $reader["Id"]
            owners = if ($reader["Owners"] -is [DBNull]) { $null } else { $reader["Owners"] }
            licenseNumber = if ($reader["LicenseNumber"] -is [DBNull]) { $null } else { $reader["LicenseNumber"] }
            businessName = if ($reader["BusinessName"] -is [DBNull]) { $null } else { $reader["BusinessName"] }
            status = if ($reader["Status"] -is [DBNull]) { $null } else { $reader["Status"] }
            issueDate = Read-Date $reader "IssueDate"
            renewDate = Read-Date $reader "RenewDate"
            expireDate = Read-Date $reader "ExpireDate"
            hasTelemedicine = if ($reader["HasTelemedicine"] -is [DBNull]) { $null } else { $reader["HasTelemedicine"] }
            physicalCity = if ($reader["PhysicalCity"] -is [DBNull]) { $null } else { $reader["PhysicalCity"] }
            physicalCountry = if ($reader["PhysicalCountry"] -is [DBNull]) { $null } else { $reader["PhysicalCountry"] }
            physicalLine1 = if ($reader["PhysicalLine1"] -is [DBNull]) { $null } else { $reader["PhysicalLine1"] }
            physicalLine2 = if ($reader["PhysicalLine2"] -is [DBNull]) { $null } else { $reader["PhysicalLine2"] }
            physicalState = if ($reader["PhysicalState"] -is [DBNull]) { $null } else { $reader["PhysicalState"] }
            physicalZip = if ($reader["PhysicalZip"] -is [DBNull]) { $null } else { $reader["PhysicalZip"] }
            physicalZipPlus = if ($reader["PhysicalZipPlus"] -is [DBNull]) { $null } else { $reader["PhysicalZipPlus"] }
            mailingCity = if ($reader["MailingCity"] -is [DBNull]) { $null } else { $reader["MailingCity"] }
            mailingCountry = if ($reader["MailingCountry"] -is [DBNull]) { $null } else { $reader["MailingCountry"] }
            mailingLine1 = if ($reader["MailingLine1"] -is [DBNull]) { $null } else { $reader["MailingLine1"] }
            mailingLine2 = if ($reader["MailingLine2"] -is [DBNull]) { $null } else { $reader["MailingLine2"] }
            mailingState = if ($reader["MailingState"] -is [DBNull]) { $null } else { $reader["MailingState"] }
            mailingZip = if ($reader["MailingZip"] -is [DBNull]) { $null } else { $reader["MailingZip"] }
            mailingZipPlus = if ($reader["MailingZipPlus"] -is [DBNull]) { $null } else { $reader["MailingZipPlus"] }
        })
    }

    $reader.Close()

    [ordered]@{
        total = $total
        returned = $rows.Count
        limit = $Limit
        rows = $rows
    } | ConvertTo-Json -Depth 5
}
finally {
    if ($connection.State -eq "Open") {
        $connection.Close()
    }
}
