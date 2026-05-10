param(
    [string]$CsvPath = "C:\dev\playground\buslic data\BusinessLicenseDownload.csv",
    [string]$DatabasePath = "C:\dev\playground\buslic data\BusinessLicenses.accdb"
)

$ErrorActionPreference = "Stop"

function Convert-ToDbDate($value) {
    if ([string]::IsNullOrWhiteSpace($value)) {
        return [DBNull]::Value
    }

    $parsed = [DateTime]::MinValue
    if ([DateTime]::TryParse($value, [ref]$parsed)) {
        return $parsed
    }

    return [DBNull]::Value
}

function Set-Param($command, $index, $value) {
    if ($null -eq $value -or $value -eq "") {
        $command.Parameters[$index].Value = [DBNull]::Value
    }
    else {
        $command.Parameters[$index].Value = $value
    }
}

if (-not (Test-Path -Path $CsvPath)) {
    throw "CSV file not found: $CsvPath"
}

if (Test-Path -Path $DatabasePath) {
    Remove-Item -Path $DatabasePath -Force
}

$databaseDirectory = Split-Path -Parent $DatabasePath
if (-not (Test-Path -Path $databaseDirectory)) {
    New-Item -ItemType Directory -Force -Path $databaseDirectory | Out-Null
}

$catalog = New-Object -ComObject ADOX.Catalog
$catalog.Create("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$DatabasePath;")
$catalog.ActiveConnection.Close() | Out-Null

$connectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$DatabasePath;"
$connection = New-Object System.Data.OleDb.OleDbConnection($connectionString)
$connection.Open()

try {
    $createSql = @"
CREATE TABLE BusinessLicenses (
    Id AUTOINCREMENT CONSTRAINT PrimaryKey PRIMARY KEY,
    Owners LONGTEXT,
    LicenseNumber LONG,
    BusinessName TEXT(255),
    [Status] TEXT(40),
    IssueDate DATETIME,
    RenewDate DATETIME,
    ExpireDate DATETIME,
    HasTelemedicine TEXT(10),
    PhysicalCity TEXT(100),
    PhysicalCountry TEXT(100),
    PhysicalLine1 TEXT(255),
    PhysicalLine2 TEXT(255),
    PhysicalState TEXT(20),
    PhysicalZip TEXT(20),
    PhysicalZipPlus TEXT(20),
    MailingCity TEXT(100),
    MailingCountry TEXT(100),
    MailingLine1 TEXT(255),
    MailingLine2 TEXT(255),
    MailingState TEXT(20),
    MailingZip TEXT(20),
    MailingZipPlus TEXT(20)
)
"@

    $command = $connection.CreateCommand()
    $command.CommandText = $createSql
    $command.ExecuteNonQuery() | Out-Null

    foreach ($indexSql in @(
        "CREATE INDEX IX_BusinessLicenses_LicenseNumber ON BusinessLicenses (LicenseNumber)",
        "CREATE INDEX IX_BusinessLicenses_BusinessName ON BusinessLicenses (BusinessName)",
        "CREATE INDEX IX_BusinessLicenses_Status ON BusinessLicenses ([Status])",
        "CREATE INDEX IX_BusinessLicenses_PhysicalCity ON BusinessLicenses (PhysicalCity)",
        "CREATE INDEX IX_BusinessLicenses_PhysicalState ON BusinessLicenses (PhysicalState)"
    )) {
        $command = $connection.CreateCommand()
        $command.CommandText = $indexSql
        $command.ExecuteNonQuery() | Out-Null
    }

    Add-Type -AssemblyName Microsoft.VisualBasic
    $parser = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($CsvPath)
    $parser.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $parser.SetDelimiters(",")
    $parser.HasFieldsEnclosedInQuotes = $true

    $headers = $parser.ReadFields()
    $expectedHeaders = @(
        "Owners", "LicenseNumber", "BusinessName", "Status", "IssueDate", "RenewDate", "ExpireDate",
        "HasTelemedicine", "PhysicalCity", "PhysicalCountry", "PhysicalLine1", "PhysicalLine2",
        "PhysicalState", "PhysicalZip", "PhysicalZipPlus", "MailingCity", "MailingCountry",
        "MailingLine1", "MailingLine2", "MailingState", "MailingZip", "MailingZipPlus"
    )

    if (($headers -join "|") -ne ($expectedHeaders -join "|")) {
        throw "Unexpected CSV headers. Found: $($headers -join ', ')"
    }

    $transaction = $connection.BeginTransaction()
    $insert = $connection.CreateCommand()
    $insert.Transaction = $transaction
    $insert.CommandText = @"
INSERT INTO BusinessLicenses
(Owners, LicenseNumber, BusinessName, [Status], IssueDate, RenewDate, ExpireDate, HasTelemedicine,
 PhysicalCity, PhysicalCountry, PhysicalLine1, PhysicalLine2, PhysicalState, PhysicalZip, PhysicalZipPlus,
 MailingCity, MailingCountry, MailingLine1, MailingLine2, MailingState, MailingZip, MailingZipPlus)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"@

    $types = @(
        [System.Data.OleDb.OleDbType]::LongVarWChar,
        [System.Data.OleDb.OleDbType]::Integer,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::Date,
        [System.Data.OleDb.OleDbType]::Date,
        [System.Data.OleDb.OleDbType]::Date,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar,
        [System.Data.OleDb.OleDbType]::VarWChar
    )

    foreach ($type in $types) {
        $insert.Parameters.Add((New-Object System.Data.OleDb.OleDbParameter("@p", $type))) | Out-Null
    }

    $rowCount = 0
    while (-not $parser.EndOfData) {
        $fields = $parser.ReadFields()
        Set-Param $insert 0 $fields[0]

        $licenseNumber = 0
        if ([int]::TryParse($fields[1], [ref]$licenseNumber)) {
            $insert.Parameters[1].Value = $licenseNumber
        }
        else {
            $insert.Parameters[1].Value = [DBNull]::Value
        }

        Set-Param $insert 2 $fields[2]
        Set-Param $insert 3 $fields[3]
        $insert.Parameters[4].Value = Convert-ToDbDate $fields[4]
        $insert.Parameters[5].Value = Convert-ToDbDate $fields[5]
        $insert.Parameters[6].Value = Convert-ToDbDate $fields[6]

        for ($i = 7; $i -lt 22; $i++) {
            Set-Param $insert $i $fields[$i]
        }

        $insert.ExecuteNonQuery() | Out-Null
        $rowCount++

        if (($rowCount % 5000) -eq 0) {
            $transaction.Commit()
            Write-Host "Imported $rowCount rows..."
            $transaction = $connection.BeginTransaction()
            $insert.Transaction = $transaction
        }
    }

    $transaction.Commit()
    $parser.Close()

    $summary = [ordered]@{
        databasePath = $DatabasePath
        importedRows = $rowCount
    }

    $summary | ConvertTo-Json
}
finally {
    if ($connection.State -eq "Open") {
        $connection.Close()
    }
}
